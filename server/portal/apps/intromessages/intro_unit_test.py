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
            "user_id": "2",
            "unread": False,
            "component": "HISTORY",
            "datetime": "2021-11-01T01:58:28",
        },
        {
            "id": "3",
            "user_id": "2",
            "unread": False,
            "component": "ALLOCATIONS",
            "datetime": "2021-10-29T02:58:28",
        },        
    ]

@pytest.fixture
def intromessage_mock(authenticated_user):
    IntroMessages.objects.create(user=authenticated_user, component="HISTORY", unread=False)


"""test get of "read" (not unread) IntroMessages for an authenticated user
"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get(client, authenticated_user):
    response = client.get('/api/intromessages/msg/')
    assert response.status_code == 200


"""Test get of "read" IntroMessages for an unauthenticated user
user should be redirected to login? 
"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get_unauthenticated_user(client, regular_user):
    response = client.get('/api/intromessages/msg/')
    assert response.status_code == 302


"""Test the marking of an IntroMessage as "read" by writing to the database """
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_put(client, authenticated_user):
    body = {
            "unread": False,
            "component": "HISTORY",
    }
    response = client.put('/api/intromessages/msg/', 
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200
    


"""Confirm that the JSON coming back is as expected
"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_response_data(client, authenticated_user, intromessage_mock):
    response = client.get('/api/intromessages/msg/')
    data = response.json()
    assert response.status_code == 200
    assert data["response"] == [{"component": "HISTORY", "unread": False}]
