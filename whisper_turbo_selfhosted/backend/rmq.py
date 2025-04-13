import json
import logging
from typing import Union

import aio_pika

import asyncio
from processing import transcribe_audio, transcribe_to_speech_pipeline
from schemas import RMQAudioMessageDTO
from settings import Settings
import backoff
import aiormq


logger = logging.getLogger(__name__)


class AIOPikaClient:
    def __init__(self, settings: Settings):
        self._channel = None
        self._exchange = None
        self._connection = None
        self.settings = settings

    async def _get_aio_connection(self):
        return await aio_pika.connect_robust(
            url=self.settings.rmq_url,
            host=self.settings.rmq_host,
            port=self.settings.rmq_port,
            password=self.settings.rmq_password,
            virtualhost=self.settings.rmq_url,
            ssl=False,
            timeout=1200,
        )

    async def connect(self, queue_name: str):
        try:
            self._connection = await self._get_aio_connection()
            self._connection.reconnect_callbacks.add(self.on_connection_restore)
            self._channel = await self._connection.channel(channel_number=1)
            self._exchange = await self._channel.declare_exchange(
                queue_name, timeout=1200
            )
        except asyncio.exceptions.CancelledError:
            pass
        except Exception as e:
            logger.info(f"Failed to establish an rmq connection: {str(e)}")
            await self.disconnect()

    async def disconnect(self) -> None:
        try:
            if self._channel and not self._channel.is_closed:
                await self._channel.close()
            if self._connection and not self._connection.is_closed:
                await self._connection.close()
            self._connection = None
            self._channel = None
        except asyncio.exceptions.CancelledError:
            logger.error("CancelledError triggered on disconnect")

        except aio_pika.exceptions.ChannelClosed:
            logger.error("Failed to close already closed channel during disconnect")

    def on_connection_restore(self, *args, **kwargs):
        self._channel = None
        self._exchange = None
        logger.info("Reconnected to the RMQ")


class AIOPikaProducer:
    _connection = None
    _channel = None

    def __init__(self, settings: Settings) -> None:
        self.channel_number = 2
        self.queue_name = settings.audio_queue_name
        self.settings = settings

    @backoff.on_exception(
        backoff.expo, aiormq.exceptions.AMQPConnectionError, max_time=300
    )
    async def __aenter__(self):
        self._connection = await aio_pika.connect_robust(self.settings.rmq_url)
        self._channel = await self._connection.channel(self.channel_number)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await self._connection.close()
            self._connection = None
            self._channel = None
        except exc_type:
            logger.error(f"Producer has failed unexpectedly: {exc_tb}")

    async def produce_message(self, message: str):
        await self._channel.default_exchange.publish(
            aio_pika.Message(body=message.encode()),
            routing_key=self.queue_name,  # noqa
        )
        logger.info(f"Sent {message} in {self.queue_name} queue")


class AIOPikaConsumer(AIOPikaClient):
    _producer: Union[AIOPikaProducer, None] = None

    def __init__(
        self,
        settings: Settings,
    ):
        super().__init__(settings=settings)

        self.consumer_channel_number = 3
        self.consumer_queue_name = settings.audio_queue_name

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()

    async def connect(self):
        return await super().connect(self.consumer_queue_name)

    async def start_consuming(self):
        # if self._channel:
        await self._channel.set_qos(prefetch_count=1)
        queue_name = self.settings.audio_queue_name
        consumer_exchange = await self._channel.declare_exchange(queue_name)

        queue: aio_pika.abc.AbstractQueue = await self._channel.declare_queue(
            queue_name
        )
        await queue.bind(consumer_exchange)
        await queue.consume(self._process_message)

    async def _process_message(self, message: aio_pika.abc.AbstractIncomingMessage):
        raise NotImplementedError("Subclass should implement this method per use case")


class RMQConsumer(AIOPikaConsumer):
    async def _process_message(self, message: aio_pika.abc.AbstractIncomingMessage):
        msg_body = message.body.decode()
        message_obj = RMQAudioMessageDTO(**json.loads(msg_body))
        print(f"fp: {message_obj.fp}")
        transcribe_to_speech_pipeline(message=message_obj)
        return

    async def get_all_messages(self) -> None:
        if not self._channel:
            logger.error("Failed to get messages. Connection to RMQ is not established")
            return None
        await self._channel.set_qos(prefetch_count=100)
        queue = await self._channel.declare_queue(
            self.settings.audio_queue_name,
            auto_delete=False,
            durable=True,
            passive=True,
        )
        while True:
            try:
                message = await queue.get(no_ack=False)
                logger.debug("Received message")
            except aio_pika.exceptions.QueueEmpty:
                break
            async with message.process():
                await self._process_message(message=message)
        return None
