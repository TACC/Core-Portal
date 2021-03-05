def test_search_unauthenticated(client, regular_user):
    response = client.get('/search/')
    assert response.status_code == 200
    assert response.context['setup_complete'] is False


def test_search_authenticated_without_setup_complete(client, authenticated_user):
    response = client.get('/search/')
    assert response.status_code == 200
    assert response.context['setup_complete'] is False


def test_search_authenticated_with_setup_complete(client, authenticated_user):
    authenticated_user.profile.setup_complete = True
    authenticated_user.profile.save()
    response = client.get('/search/')
    assert response.status_code == 200
    assert response.context['setup_complete']
