from django.http import JsonResponse
from portal.apps.intromessages.views import IntroMessagesView
import json
import pytest
import logging


from portal.apps.intromessages.models import IntroMessages

@pytest.fixture
def mock_intromessages(scope="module"):
    yield [
        {
            "id": "2",
            "user_id": "1",
            "unread": False,
            "component": "HISTORY",
            "datetime": "2021-11-01T01:58:28",
        },
        {
            "id": "3",
            "user_id": "1",
            "unread": False,
            "component": "DASHBOARD",
            "datetime": "2021-10-29T02:58:28",
        },        
    ]

@pytest.fixture
def mock_intromessage(scope="module"):
    yield [
        {
            "id": "2",
            "user_id": "1",
            "unread": False,
            "component": "HISTORY",
            "datetime": "2021-11-01T01:58:28",
        }      
    ]


# test get of "read" (not unread) IntroMessages for an authenticated user
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get(client, authenticated_user, mock_intromessages):
    response = client.get('/api/intromessages/msg/')
    assert response.status_code == 200

# test get of "read" IntroMessages for an unauthenticated user
# user should be redirected to login?
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get(client, regular_user, mock_intromessages):
    response = client.get('/api/intromessages/msg/')
    assert response.status_code == 302

# test the marking of an IntroMessage as "read" by writing to the database
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_put(client, authenticated_user):
    body = {
            "user_id": 1,
            "unread": False,
            "component": "HISTORY",
    }
    response = client.put('/api/intromessages/msg/', 
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200