from uuid import uuid4
from datetime import datetime


def generate_wav_file_name():
    return f'audio_{uuid4()}_{datetime.now().strftime("%H_%M_%S")}.wav'


def timer(func):
    def wrapper(*args, **kwargs):
        start = datetime.now()
        result = func(*args, **kwargs)
        end = datetime.now()
        print(f"Time taken: {(end-start).total_seconds()}")
        return result

    return wrapper
