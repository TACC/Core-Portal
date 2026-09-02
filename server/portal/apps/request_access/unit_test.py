
def test_request_access_get(client, regular_user):
    response = client.get('/request-access/')
    assert response.status_code == 200


def test_request_access_authenticated(client, authenticated_user):
    response = client.get('/request-access/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/'
