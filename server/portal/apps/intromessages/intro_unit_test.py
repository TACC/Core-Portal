import pytest
from portal.apps.intromessages.models import IntroMessages


@pytest.fixture
def intromessage_mock(authenticated_user):
    IntroMessages.objects.create(user=authenticated_user, component="HISTORY", unread=False)


"""
Test get of "read" (not unread) IntroMessages for an authenticated user and
confirm that the JSON is coming back as expected.
"""


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_intromessages_get(client, authenticated_user, intromessage_mock):
    response = client.get('/api/intromessages/')
    data = response.json()
    assert response.status_code == 200
    print(data)
    assert data["response"] == [{"component": "HISTORY", "unread": False}]


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
            'ACCOUNT': {'unread': True},
            'ALLOCATIONS': {'unread': True},
            'APPLICATIONS': {'unread': True},
            'DASHBOARD': {'unread': True},
            'DATA': {'unread': True},
            'HISTORY': {'unread': False},
            'TICKETS': {'unread': True},
            'UI': {'unread': True}                  
    }
    response = client.put('/api/intromessages/',
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200
    # should be eight rows in the database for the user
    assert len(IntroMessages.objects.all()) == 8
    # let's check to see all rows exist correctly
    db_messages = IntroMessages.objects.all().values()
    for component_name, component_value in body.items():
        found = False
        correct_status = False
        for db_message in db_messages:
            if db_message['component'] == component_name:
                found = True
                if db_message['unread'] == component_value['unread']:
                    correct_status = True
                break
        assert found
        assert correct_status


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
    print("==========>> Length = " + str(len(IntroMessages.objects.all())))
    assert len(IntroMessages.objects.all()) == 0
