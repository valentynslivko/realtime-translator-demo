import asyncio
import logging
import traceback
from typing import Any, Callable, Optional

from aiormq import AMQPConnectionError
from apscheduler.job import Job
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import WebSocket
from rmq import RMQConsumer
from settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
consumer = RMQConsumer(settings=settings)


class SchedulerService:
    def __init__(self, scheduler_cls) -> None:  # type: ignore
        self.scheduler = scheduler_cls()
        logger.info(f"Created a scheduler: {self.scheduler}")

    @staticmethod
    def _sync_add_new_jobs(func: Any, **kwargs) -> Any:  # type: ignore
        return asyncio.run(func(**kwargs))

    def add_job(
        self, func: Callable, is_sync: Optional[bool] = False, *args, **kwargs
    ) -> Job:  # type: ignore
        logger.info(f"Adding a new job: {func.__name__}")
        if not is_sync:
            return self.scheduler.add_job(
                self._sync_add_new_jobs, args=(func,), misfire_grace_time=None, **kwargs
            )
        return self.scheduler.add_job(func, *args, **kwargs)

    def shutdown(self, *args, **kwargs) -> None:  # type: ignore
        self.scheduler.shutdown(*args, **kwargs)
        logger.info(f"Shut down a scheduler: {self.scheduler}")

    def start(self) -> None:
        self.scheduler.start()
        logger.info(f"Started a scheduler: {self.scheduler}")


scheduler_service = SchedulerService(BackgroundScheduler)


async def process_available_messages() -> None:
    try:
        async with RMQConsumer(settings=settings) as rmq_service:
            await rmq_service.get_all_messages()
    except AMQPConnectionError as e:
        logger.error(f"Error while getting messages from queue: {e}")
        return None


async def process_chunks(websocket: WebSocket):
    try:
        async with RMQConsumer(settings=settings) as rmq:
            await rmq.return_sound_chunk(websocket=websocket)
    except AMQPConnectionError as e:
        logger.error(f"Error while getting messages from queue: {e}")
        return None
    except Exception as e:
        logger.error(f"err: {traceback.format_exc()}")
        raise e
