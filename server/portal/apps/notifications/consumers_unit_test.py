import pytest
from channels.testing import WebsocketCommunicator
from .consumers import NotificationsConsumer
from channels.layers import get_channel_layer


@pytest.mark.asyncio
async def test_can_connect_to_server(authenticated_user):
    communicator = await auth_connect(authenticated_user)
    # Close
    await communicator.disconnect()


@pytest.mark.asyncio
async def test_can_send_and_receive_messages(authenticated_user):
    communicator = await auth_connect(authenticated_user)
    message = {
        'type': 'echo.message',
        'body': "This is a test message"
    }
    await communicator.send_json_to(message)
    response = await communicator.receive_json_from()
    assert response == message
    await communicator.disconnect()


@pytest.mark.asyncio
async def test_can_send_and_receive_broadcast_messages(authenticated_user):
    communicator = await auth_connect(authenticated_user)
    message = {
        'type': 'portal.notification',
        'body': "This is a test event"
    }
    channel_layer = get_channel_layer()
    await channel_layer.group_send(authenticated_user.username, message=message)
    response = await communicator.receive_json_from()
    assert response == message['body']

    await channel_layer.group_send('portal_events', message=message)
    response = await communicator.receive_json_from()
    assert response == message['body']
    await communicator.disconnect()


async def auth_connect(user):

    # Pass session ID in headers to authenticate.
    communicator = WebsocketCommunicator(
        NotificationsConsumer,
        path='/ws/notifications/'
    )
    communicator.scope['user'] = user
    connected, _ = await communicator.connect()
    assert connected is True
    return communicator
