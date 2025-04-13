from piper.voice import PiperVoice
from pathlib import Path
import wave
import pyaudio
from utils import generate_wav_file_name

path = Path(__file__).absolute().parent.parent


def run_tts(tts_text: str):

    output_wav = path / f"tts_outputs/{generate_wav_file_name()}"
    # play_sound_through_microphone(output_wav)


# def play_sound_through_microphone(fp: Path):
#     VIRTUAL_MIC_NAME = "VirtualMic"

#     # Open the WAV file
#     wav_file = wave.open(str(fp), "rb")

#     # Initialize PyAudio
#     audio = pyaudio.PyAudio()

#     # Find the virtual microphone index
#     def get_virtual_mic_index():
#         for i in range(audio.get_device_count()):
#             device_info = audio.get_device_info_by_index(i)
#             if VIRTUAL_MIC_NAME in device_info["name"]:
#                 return device_info["index"]
#         return None

#     virtual_mic_index = get_virtual_mic_index()
#     if virtual_mic_index is None:
#         raise RuntimeError("Virtual microphone not found!")

#     # Open the output stream to the virtual microphone
#     stream = audio.open(
#         format=audio.get_format_from_width(wav_file.getsampwidth()),
#         channels=wav_file.getnchannels(),
#         rate=wav_file.getframerate(),
#         output=True,
#         output_device_index=virtual_mic_index,
#     )

#     # Read and play audio in chunks
#     chunk_size = 1024
#     data = wav_file.readframes(chunk_size)

#     while data:
#         stream.write(data)
#         data = wav_file.readframes(chunk_size)

#     # Cleanup
#     stream.stop_stream()
#     stream.close()
#     audio.terminate()
#     wav_file.close()
