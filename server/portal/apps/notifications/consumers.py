from channels.generic.websocket import AsyncWebsocketConsumer

import logging
logger = logging.getLogger(__name__)


class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(self.scope['user'].username,
                                           self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def test_message(self, event):
        await self.send(text_data=event['message'])

    async def receive(self, text_data):
        pass
