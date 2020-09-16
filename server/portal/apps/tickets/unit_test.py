def test_tickets_get(client, authenticated_user):
    response = client.get('/tickets/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/'


def test_ticket_create_authenticated(client, regular_user):
    """Users who are setup_complete may use workbench/dashboard routes
    """
    regular_user.profile.setup_complete = True
    regular_user.profile.save()
    client.force_login(regular_user)
    response = client.get('/tickets/new/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/tickets/create/'


def test_ticket_create_authenticated_setup_incomplete(client, regular_user):
    """Users who are not setup_complete should not be redirected
    to the /workbench/dashboard route, because the setup_complete
    middleware would redirect them to the onboarding view
    """
    regular_user.profile.setup_complete = False
    regular_user.profile.save()
    client.force_login(regular_user)
    response = client.get('/tickets/new/')
    assert response.status_code == 200
