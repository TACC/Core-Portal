def test_tickets_get(client, authenticated_user):
    response = client.get('/tickets/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/'


def test_ticket_create_authenticated(client, authenticated_user):
    response = client.get('/tickets/new/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/tickets/create/'
