FROM python:3.10-slim AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates ssh git ffmpeg portaudio19-dev libportaudio2 gcc build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh

ENV PATH="/root/.local/bin:$PATH"

COPY pyproject.toml* uv.lock* ./
RUN uv venv && uv sync --frozen

RUN uv pip uninstall torch torchvision torchaudio
RUN uv pip install torch==2.6.0 torchaudio==2.6.0 torchvision --index-url https://download.pytorch.org/whl/cu118 



COPY . /app

ENV PATH="/app/.venv/bin:$PATH"

CMD [ "/app/.venv/bin/python", "main.py" ]