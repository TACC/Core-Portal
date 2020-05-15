import json
from django.conf import settings


def test_workspace(client, authenticated_user):
    response = client.get('/api/workbench/')
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result['debug'] == settings.DEBUG
