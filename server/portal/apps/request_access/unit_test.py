
def test_request_access_get(client, regular_user):
    """Users who are authenticated are redirected to workbench/dashboard
    """
    client.force_login(regular_user)
    response = client.get('/request-access/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/'


def test_request_access_authenticated(client, authenticated_user):
    response = client.get('/request-access/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/'
