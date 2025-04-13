from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    rmq_host: str = Field(default="0.0.0.0", env="RMQ_HOST", alias="RMQ_HOST")
    rmq_url: str = Field(env="RMQ_URL", alias="RMQ_URL")
    rmq_port: str = Field(default=5672, env="RMQ_PORT", alias="RMQ_PORT")
    rmq_password: str = Field(env="RMQ_PASSWORD", alias="RMQ_PASSWORD")
    rmq_user: str = Field(env="RMQ_USER", alias="RMQ_USER")

    audio_queue_name: str = Field(default="audio_queue")


@lru_cache
def get_settings():
    return Settings(_env_file=".env")
