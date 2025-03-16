from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.websockets import WebSocket
import uvicorn
from model import load_model
from transformers.pipelines import Pipeline


@asynccontextmanager
async def lifecycle(app: FastAPI):
    pipeline = load_model()
    app.state.pipeline = pipeline
    yield


app = FastAPI(lifespan=lifecycle)


@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    pipeline: Pipeline = websocket.state.pipeline
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")


if __name__ == "__main__":
    uvicorn.run("main:app", port=8001)
