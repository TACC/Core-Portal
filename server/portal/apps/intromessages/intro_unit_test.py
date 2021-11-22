import pytest
from portal.apps.intromessages.models import IntroMessages


@pytest.fixture
def intromessage_mock(authenticated_user):
    IntroMessages.objects.create(user=authenticated_user, component="HISTORY", unread=False)


"""
Test get of "read" (not unread) IntroMessages for an authenticated user
"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get(client, authenticated_user):
    response = client.get('/api/intromessages/')
    assert response.status_code == 200


"""
Test get of "read" IntroMessages for an unauthenticated user
User should be redirected to login 
"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get_unauthenticated_user(client, regular_user):
    response = client.get('/api/intromessages/')
    assert response.status_code == 302



"""Test the marking of an IntroMessage as "read" by writing to the database """
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_put(client, authenticated_user):
    body = {
            'HISTORY': {'unread': False}
    }
    response = client.put('/api/intromessages/', 
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200
    # should be just one row in the database for the user
    assert len(IntroMessages.objects.all()) == 1
    row = IntroMessages.objects.all().first()
    # assert one row in database
    # assert row looks like data from body
    assert row.component == 'HISTORY'
    assert row.unread == False
    assert row.user == authenticated_user
       

"""
Test to make sure rows are not saved where unread == True 
IntroMessages are only saved to the database when they have
been read/dismissed (unread = False)
"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_put_unread_true(client, authenticated_user):
    body = {
            'HISTORY': {'unread': True}
    }
    response = client.put('/api/intromessages/', 
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200
    # unread == True is not saved to the database
    assert len(IntroMessages.objects.all()) == 0



"""Confirm that the JSON coming back is as expected"""
@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_response_data(client, authenticated_user, intromessage_mock):
    response = client.get('/api/intromessages/')
    data = response.json()
    assert response.status_code == 200
    assert data["response"] == [{"component": "HISTORY", "unread": False}]
