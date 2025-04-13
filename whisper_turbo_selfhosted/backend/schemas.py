from pydantic import BaseModel


class RMQAudioMessageDTO(BaseModel):
    fp: str
