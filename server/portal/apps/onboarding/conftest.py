from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
import pytest


@pytest.fixture
def onboarding_event(authenticated_user):
    event = SetupEvent.objects.create(
        user=authenticated_user,
        state=SetupState.PENDING,
        step="TestStep",
        message="test message"
    )
    event.save()
    yield event
