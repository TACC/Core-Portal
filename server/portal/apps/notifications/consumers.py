from channels.generic.websocket import AsyncJsonWebsocketConsumer

import logging
logger = logging.getLogger(__name__)


class NotificationsConsumer(AsyncJsonWebsocketConsumer):
    """
    This notifications consumer handles websocket connections for clients.

    It uses AsyncJsonWebsocketConsumer, which means all the handling functions
    must be async functions, and any sync work (like ORM access) has to be
    behind database_sync_to_async or sync_to_async. For more, read
    http://channels.readthedocs.io/en/latest/topics/consumers.html
    """

    async def connect(self):
        """
        Called when the websocket is handshaking as part of initial connection.
        """

        user = self.scope["user"]
        if user.is_anonymous:
            # Reject the connection if not logged in
            await self.close()
        else:
            # Add channel connection to username and general groups
            await self.channel_layer.group_add(user.username,
                                               self.channel_name)
            await self.channel_layer.group_add('portal_events',
                                               self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        """
        Called when the WebSocket closes for any reason.
        """
        await self.channel_layer.group_discard(
            group=self.scope["user"].username,
            channel=self.channel_name
        )
        await self.channel_layer.group_discard(
            group='portal_events',
            channel=self.channel_name
        )

    async def portal_notification(self, event):
        """
        Called when we want to send a notification event to the client.

        ** Note: send_json automatically encodes the dict to json
        """
        await self.send_json(event['body'])

    async def receive_json(self, content):
        """
        Called when we get a text frame. Channels will JSON-decode the payload
        for us and pass it as the first argument.
        """
        await self.send_json(content)
