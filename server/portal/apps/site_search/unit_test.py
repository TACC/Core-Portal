def test_search_endpoint_returns_200(client):
    response = client.get('/search/')
    assert response.status_code == 200
