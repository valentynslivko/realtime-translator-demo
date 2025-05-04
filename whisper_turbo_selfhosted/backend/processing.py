import os
from typing import Optional, Union
from schemas import RMQAudioMessageDTO
from whisper import Whisper
from pathlib import Path
from piper.voice import PiperVoice
from kokoro import KPipeline
import wave
from translation import translate_message
from utils import generate_wav_file_name, timer
from scipy.io.wavfile import write as write_wav
from TTS.api import TTS
import logging

path = Path(__file__).absolute().parent
MODEL_OBJECT_VAULT: dict[str, Union[Whisper, PiperVoice, KPipeline, TTS]] = {
    "whisper": None,
    "piper": None,
    "m2m_model": None,
    "m2m_tokenizer": None,
    "kokoro": None,
    "suno_processor": None,
    "suno_model": None,
    "tts": None,
}
os.environ["SUNO_USE_SMALL_MODELS"] = "True"

logger = logging.getLogger(__name__)


def transcribe_audio(message: RMQAudioMessageDTO):
    whisper_model = MODEL_OBJECT_VAULT.get("whisper")
    if not whisper_model:
        raise Exception("Whisper was not initialized correctly, aborting")

    transcription = whisper_model.transcribe(str(path / "audio" / message.fp))
    return transcription["text"]


def translate_from_transcribe(
    text: str, lang_from: str = "en", lang_to: str = "fr"
) -> Optional[list[str]]:
    m2m_model = MODEL_OBJECT_VAULT.get("m2m_model")
    m2m_tokenizer = MODEL_OBJECT_VAULT.get("m2m_tokenizer")

    if not m2m_model:
        raise Exception("m2m_model was not initialized correctly, aborting")

    if not m2m_tokenizer:
        raise Exception("m2m_tokenizer was not initialized correctly, aborting")

    return translate_message(
        model=m2m_model,
        tokenizer=m2m_tokenizer,
        text_in=text,
        lang_from=lang_from,
        lang_to=lang_to,
    )


def piper_tts_from_transcription(transcription_text: str) -> str:
    piper_tts_model = MODEL_OBJECT_VAULT.get("piper")
    if not piper_tts_model:
        raise Exception("Whisper was not initialized correctly, aborting")

    wav_tts_file_output = str(path / f"tts_outputs/{generate_wav_file_name()}")
    wav_file = wave.open(wav_tts_file_output, "w")
    piper_tts_model.synthesize(transcription_text, wav_file)
    return wav_tts_file_output


def kokoro_tts(transcription_text: str):
    kokoro_tts_pipeline = MODEL_OBJECT_VAULT.get("kokoro")
    if not kokoro_tts_pipeline:
        raise Exception("Kokoro was not initialized correctly, aborting")

    generator = kokoro_tts_pipeline(text=transcription_text, voice="ff_siwis")

    wav_tts_file_output = str(path / f"tts_outputs/{generate_wav_file_name()}")
    wav_file = wave.open(wav_tts_file_output, "w")

    for _, _, audio in generator:
        wav_file.writeframes(audio)

    return wav_tts_file_output


def suno_tts(transcription_text: str):
    suno_processor = MODEL_OBJECT_VAULT.get("suno_processor")
    if not suno_processor:
        raise Exception("suno_processor was not initialized correctly, aborting")

    suno_model = MODEL_OBJECT_VAULT.get("suno_model")
    if not suno_processor:
        raise Exception("suno_model was not initialized correctly, aborting")

    # voice_preset = "v2/en_speaker_6"
    voice_preset = "v2/fr_speaker_6"

    inputs = suno_processor(transcription_text, voice_preset=voice_preset).to("cuda:0")
    attention_mask = inputs["attention_mask"]
    sample_rate = suno_model.generation_config.sample_rate
    audio_array = suno_model.generate(
        input_ids=inputs["input_ids"],
        attention_mask=attention_mask,
        pad_token_id=suno_processor.tokenizer.pad_token_id,
    ).to("cuda:0")
    audio_array = audio_array.cpu().numpy().squeeze()
    write_wav(
        str(path / f"tts_outputs/{generate_wav_file_name()}"),
        rate=sample_rate,
        data=audio_array,
    )
    return


def TTS_processing(transcription_text: str):
    tts = MODEL_OBJECT_VAULT.get("tts")
    if not tts:
        raise Exception("suno_processor was not initialized correctly, aborting")

    tts.tts_to_file(
        text=transcription_text,
        file_path=str(path / f"tts_outputs/{generate_wav_file_name()}"),
    )
    return


@timer
def transcribe_to_speech_pipeline(message: RMQAudioMessageDTO):
    text = transcribe_audio(message=message)
    logger.info("=" * 30)
    logger.info(f"transcription: {text}")
    logger.info("=" * 30)

    translated_text = translate_from_transcribe(text=text)
    if not translated_text:
        logger.info("No translated text was returned")
        return

    translated_text = translated_text[0]
    logger.info("=" * 30)
    logger.info(f"translation: {translated_text}")
    logger.info("=" * 30)

    # tts_output = tts_from_transcription(transctiption_text=translated_text)
    # tts_output = kokoro_tts(transcription_text=translated_text)
    # tts_output = suno_tts(transcription_text=translated_text)
    TTS_processing(transcription_text=translated_text)
