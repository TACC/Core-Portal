import pytest
from portal.apps.intromessages.models import IntroMessages, CustomMessageTemplate, CustomMessages

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
        'ACCOUNT': 'True',
        'ALLOCATIONS': 'True',
        'APPLICATIONS': 'True',
        'DASHBOARD': 'True',
        'DATA': 'True',
        'HISTORY': 'False',
        'TICKETS': 'True',
        'UI': 'True'
    }

    response = client.put('/api/intromessages/',
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200
    # should be eight rows in the database for the user
    assert len(IntroMessages.objects.all()) == 8
    # let's check to see all rows exist correctly
    for component_name, component_value in body.items():
        correct_status = False
        db_message = IntroMessages.objects.filter(component=component_name)
        if db_message and db_message[0].unread != component_value:
            correct_status = True

        assert correct_status

@pytest.fixture
def custommessage_mock(authenticated_user):
    CustomMessages.objects.create(user=authenticated_user, template_id=1)

@pytest.fixture
def custommessagetemplate_mock():
    CustomMessageTemplate.objects.create(component='HISTORY', message_type='warning', message='test message', dismissable=True)

"""
Test get of "read" (not unread) CustomMessages for an authenticated user and
confirm that the JSON is coming back as expected.
"""

@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_custommessages_get(client, authenticated_user, custommessage_mock, custommessagetemplate_mock):
    response = client.get('/api/intromessages/custom/')
    data = response.json()
    assert response.status_code == 200
    assert data["response"] == {
        'messages': [{"template_id": 1, "unread": False}],
        'templates': [{
            'id': 1,
            'component': 'HISTORY',
            'message_type': 'warning',
            'dismissable': True,
            'message': 'test message'
        }]
    }

"""
Test get of "read" CustomMessages for an unauthenticated user
User should be redirected to login
"""

@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_custommessages_get_unauthenticated_user(client, regular_user):
    response = client.get('/api/intromessages/custom/')
    assert response.status_code == 302

"""Test the marking of an CustomMessage as "read" by writing to the database """

@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_custommessages_put(client, authenticated_user):
    body = {
        'messages': [{"template_id": 1, "unread": True}],
        'templates': [{
            'id': 1,
            'component': 'HISTORY',
            'message_type': 'warning',
            'dismissable': True,
            'message': 'test message'
        }]
    }

    response = client.put('/api/intromessages/custom/',
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200
    # should be eight rows in the database for the user
    assert len(CustomMessages.objects.all()) == 8
    # let's check to see all rows exist correctly
    for template_id, message_value in body.items():
        correct_status = False
        db_message = CustomMessages.objects.filter(template_id=template_id)
        if db_message and db_message[0].unread != message_value:
            correct_status = True

        assert correct_status
