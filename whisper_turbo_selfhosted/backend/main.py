import asyncio
import json
import logging
import os
import pathlib
from contextlib import asynccontextmanager
from datetime import datetime

import aio_pika
import aiofiles
import starlette
import starlette.websockets
import uvicorn
import whisper
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.websockets import WebSocket
from jobs import process_available_messages, process_chunks, scheduler_service
from processing import MODEL_OBJECT_VAULT
from rmq import AIOPikaProducer
from settings import get_settings
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
from TTS.api import TTS
from utils import generate_wav_file_name

os.environ["SUNO_USE_SMALL_MODELS"] = "True"
# from kokoro import KPipeline, KModel

settings = get_settings()
path = pathlib.Path(__file__).absolute().parent

logging.getLogger("apscheduler").setLevel(logging.ERROR)
logging.basicConfig()
logging.root.setLevel(logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifecycle(app: FastAPI):
    connection = await aio_pika.connect_robust(settings.rmq_url)
    channel = await connection.channel()
    logger.info('Creating queue "audio_queue"')
    await channel.declare_queue("audio_queue", durable=True)
    logger.info('Created queue "audio_queue"')

    logger.info('Creating queue "audio_streams"')
    await channel.declare_queue("audio_streams", durable=True)
    logger.info('Created queue "audio_streams"')

    (path.parent / "audio_in").mkdir(exist_ok=True, parents=True)
    (path / "tts_outputs").mkdir(exist_ok=True, parents=True)
    current_wav_file_name = generate_wav_file_name()

    logger.info("Loading whisper...")
    whisper_model = whisper.load_model("turbo")
    MODEL_OBJECT_VAULT["whisper"] = whisper_model

    logger.info("Loading m2m translation model...")
    translate_model = M2M100ForConditionalGeneration.from_pretrained(
        "facebook/m2m100_418M"
    )
    translate_tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
    MODEL_OBJECT_VAULT["m2m_model"] = translate_model
    MODEL_OBJECT_VAULT["m2m_tokenizer"] = translate_tokenizer

    # suno_processor = AutoProcessor.from_pretrained("suno/bark")
    # suno_model = BarkModel.from_pretrained("suno/bark").to("cuda:0")
    # # suno_model.enable_cpu_offload()
    # MODEL_OBJECT_VAULT["suno_processor"] = suno_processor
    # MODEL_OBJECT_VAULT["suno_model"] = suno_model

    logger.info("Loading TTS model...")
    # MODEL_OBJECT_VAULT["tts"] = TTS("tts_models/fr/mai/tacotron2-DDC", gpu=True).to(
    #     "cuda:0"
    # )
    MODEL_OBJECT_VAULT["tts"] = TTS("tts_models/fr/css10/vits").to("cuda:0")

    # tts_model = path / "downloads/uk_UA-ukrainian_tts-medium.onnx"
    # voice_model = PiperVoice.load(tts_model)
    # MODEL_OBJECT_VAULT["piper"] = voice_model

    # kokoro_pipeline = KPipeline(lang_code="f")
    # MODEL_OBJECT_VAULT["kokoro"] = kokoro_pipeline

    app.state.wav_file_name = current_wav_file_name
    # app.state.transcription = ""

    scheduler_service.add_job(
        func=process_available_messages,
        next_run_time=datetime.now(),
        trigger="interval",
        seconds=1,
    )
    scheduler_service.start()
    yield

    # gc.collect()


app = FastAPI(lifespan=lifecycle)


@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    wav_file_name = websocket.app.state.wav_file_name
    tempfile_fp = path / "audio_in" / wav_file_name

    # in real-world scenario - need ids of the frontend client sender to know which client sound chunk belongs to
    task = asyncio.create_task(process_chunks(websocket=websocket))

    try:
        async with aiofiles.open(tempfile_fp, "wb") as temp_audio:
            while True:
                sound_chunk = await websocket.receive_bytes()

                await temp_audio.write(sound_chunk)
                # await websocket.send_text("DEBUG: Inserted chunk to wav file")

                async with AIOPikaProducer(settings) as producer:
                    await producer.produce_message(
                        json.dumps({"fp": str(tempfile_fp)}),
                        queue_name=settings.streams_queue_name,
                    )
                    logger.info(f"Inserted msg in a queue for audio: {tempfile_fp}")
                # await websocket.send_bytes(sound_chunk)

    except starlette.websockets.WebSocketDisconnect:
        logger.debug("websocket disconnect")
        task.cancel()
    finally:
        wav_file_name = generate_wav_file_name()
        websocket.app.state.wav_file_name = wav_file_name


@app.post("/process")
async def process_audio(file: UploadFile = File(...)):
    wav_file_name = app.state.wav_file_name
    tempfile_fp: pathlib.Path = path / "audio_in" / wav_file_name
    async with aiofiles.open(tempfile_fp, "ab") as temp_audio:
        await temp_audio.write(await file.read())

    async with AIOPikaProducer(settings) as producer:
        await producer.produce_message(json.dumps({"fp": str(tempfile_fp)}))
        logger.info(f"Inserted msg in a queue for audio: {tempfile_fp}")

    # os.remove(tempfile_fp)
    app.state.wav_file_name = generate_wav_file_name()

    return JSONResponse(status_code=201, content={"fp": str(tempfile_fp.name)})


@app.get("/output")
async def get_file_output(fp: str):
    return Response(
        content=str(path.parent / "audio_in" / fp.split("/")[-1]), status_code=200
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, host="0.0.0.0", reload=True)
