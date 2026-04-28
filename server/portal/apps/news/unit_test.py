from unittest.mock import patch


@patch('portal.apps.news.views.requests.get')
def test_api_news_success_without_sanitize(mock_get, client, authenticated_user):
    mock_get.return_value.json.return_value = {
        'status': 'success',
        'result': [
            {
                'id': 1,
                'content': '<p>Hello <b>world</b></p>',
                'updates': [{'id': 10, 'content': '<div>Update</div>'}],
            }
        ],
    }

    response = client.get('/api/news/?sanitize=false')
    assert response.status_code == 200
    body = response.json()
    assert body[0]['content'] == '<p>Hello <b>world</b></p>'
    assert body[0]['updates'][0]['content'] == '<div>Update</div>'


@patch('portal.apps.news.views.requests.get')
def test_api_news_success_with_sanitize(mock_get, client, authenticated_user):
    mock_get.return_value.json.return_value = {
        'status': 'success',
        'result': [
            {
                'id': 1,
                'content': '<p>Hello <b>world</b></p>',
                'updates': [{'id': 10, 'content': '<div>Update</div>'}],
            }
        ],
    }

    response = client.get('/api/news/?sanitize=true')
    assert response.status_code == 200
    body = response.json()
    assert body[0]['content'] == 'Hello world'
    assert body[0]['updates'][0]['content'] == 'Update'


@patch('portal.apps.news.views.requests.get')
def test_api_news_failure_from_tas(mock_get, client, authenticated_user):
    mock_get.return_value.json.return_value = {
        'status': 'error',
        'message': 'bad upstream',
    }

    response = client.get('/api/news/')
    assert response.status_code == 400
