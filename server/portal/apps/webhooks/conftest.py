import pytest


@pytest.fixture
def mock_webhook_id(mocker):
    mock_get_webhook_id = mocker.patch('portal.apps.webhooks.utils.get_webhook_id')
    mock_get_webhook_id.return_value = "MOCK_WEBHOOK_ID"
    yield mock_get_webhook_id
