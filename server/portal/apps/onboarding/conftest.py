import pytest
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState


@pytest.fixture
def mock_steps(regular_user, settings):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockStep'
        }
    ]
    pending_step = SetupEvent.objects.create(
        user=regular_user,
        step="portal.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.PENDING,
        message="message"
    ).save()

    completed_step = SetupEvent.objects.create(
        user=regular_user,
        step="portal.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.COMPLETED,
        message="message",
    ).save()
    yield (pending_step, completed_step)


@pytest.fixture
def mock_retry_step(regular_user, settings):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.test_steps.MockStep',
            'settings': {
                'retry': True
            }
        }
    ]
    retry_step = SetupEvent.objects.create(
        user=regular_user,
        step="portal.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.USERWAIT,
        message="message"
    ).save()
    yield retry_step
