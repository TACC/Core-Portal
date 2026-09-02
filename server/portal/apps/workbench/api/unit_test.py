import json
from django.conf import settings


def test_workbench(client, authenticated_user):
    response = client.get('/api/workbench/')
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result['response']['config']['debug'] == settings.DEBUG
    assert result['response']['portalName'] == settings.PORTAL_NAMESPACE
