# import spaces
# import torch

# import uuid
# import scipy.io.wavfile
# import time
# from transformers import (
#     AutoModelForSpeechSeq2Seq,
#     AutoProcessor,
#     WhisperTokenizer,
#     pipeline,
# )


# def load_model():
#     device = "cuda" if torch.cuda.is_available() else "cpu"
#     torch_dtype = torch.float16
#     MODEL_NAME = "openai/whisper-large-v3-turbo"

#     model = AutoModelForSpeechSeq2Seq.from_pretrained(
#         MODEL_NAME,
#         torch_dtype=torch_dtype,
#         low_cpu_mem_usage=True,
#         use_safetensors=True,
#     )
#     model.to(device)

#     processor = AutoProcessor.from_pretrained(MODEL_NAME)
#     tokenizer = WhisperTokenizer.from_pretrained(MODEL_NAME, language="en")

#     pipe = pipeline(
#         task="automatic-speech-recognition",
#         model=model,
#         tokenizer=tokenizer,
#         feature_extractor=processor.feature_extractor,
#         max_new_tokens=25,
#         torch_dtype=torch_dtype,
#         device=device,
#     )
#     return pipe


# @spaces.GPU
# def transcribe(inputs, previous_transcription):
#     start_time = time.time()
#     try:
#         filename = f"{uuid.uuid4().hex}.wav"
#         sample_rate, audio_data = inputs
#         scipy.io.wavfile.write(filename, sample_rate, audio_data)

#         transcription = pipe(filename)["text"]
#         previous_transcription += transcription

#         end_time = time.time()
#         latency = end_time - start_time
#         return previous_transcription, f"{latency:.2f}"
#     except Exception as e:
#         print(f"Error during Transcription: {e}")
#         return previous_transcription, "Error"
