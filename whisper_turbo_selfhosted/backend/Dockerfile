FROM python:3.10-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates ssh git ffmpeg portaudio19-dev libportaudio2 gcc build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/
RUN pip install -r requirements.txt

RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

COPY . /app

CMD [ "python3", "main.py" ]