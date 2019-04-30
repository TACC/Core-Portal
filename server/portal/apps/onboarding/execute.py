from __future__ import unicode_literals, absolute_import
from inspect import isclass, isfunction
from importlib import import_module
from django.conf import settings
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.steps.abstract import AbstractStep
from celery import shared_task
from portal.apps.accounts.models import PortalProfile
import logging

logger = logging.getLogger(__name__)
class StepExecuteException(Exception):
    """
    Exception raised when setup step processing
    is interrupted
    """
    def __init__(self, message):
        super(StepExecuteException, self).__init__(message)

def new_user_setup_check(user):
    extra_steps = getattr(settings, 'PORTAL_USER_ACCOUNT_SETUP_STEPS', [])
    if len(extra_steps) == 0:
        logger.info("No extra setup steps for user {username}".format(username=user.username))
        profile = PortalProfile.objects.get(user=user)
        profile.setup_complete = True
        profile.save()
    else:
        logger.info("Preparing onboarding steps for user {username}".format(username=user.username))
        prepare_setup_steps(user)

def log_setup_state(user, message):
    # Create an event log for a user completing setup.
    # This will also signal the front end
    event = SetupEvent.objects.create(
        user=user,
        step="portal.apps.onboarding.execute.execute_setup_steps",
        state=SetupState.COMPLETED if user.profile.setup_complete else SetupState.FAILED,
        message=message,
        data={ "setup_complete" : user.profile.setup_complete }
    )
    event.save()

def load_setup_step(user, step):
    module_str, callable_str = step.rsplit('.', 1)
    module = import_module(module_str)
    call = getattr(module, callable_str)
    if not isclass(call):
        raise ValueError(
            "Setup step {step} is not a class".format(
                step=step
            )
        )
    setup_step = call(user)
    if not isinstance(setup_step, AbstractStep):
        raise ValueError(
            "Setup step {step} is not a subclass of AbstractStep".format(
                step=step
            )
        )
    return setup_step

def prepare_setup_steps(user):
    """
    Set the initial state of all setup steps for a given user
    """
    extra_steps = getattr(settings, 'PORTAL_USER_ACCOUNT_SETUP_STEPS', [])
    for step in extra_steps:
        setup_step = load_setup_step(user, step)
        if setup_step.last_event is None:
            setup_step.prepare()

@shared_task()
def execute_setup_steps(username):
    from django.contrib.auth import get_user_model
    user = get_user_model().objects.get(username=username)

    extra_steps = getattr(settings, 'PORTAL_USER_ACCOUNT_SETUP_STEPS', [])
    for step in extra_steps:
        # Restore state of this setup step for this user
        setup_step = load_setup_step(user, step)

        # Run step, if waiting for automatic execution
        # should have this state
        if setup_step.state == SetupState.PENDING:
            setup_step.state = SetupState.PROCESSING
            setup_step.log("Beginning automated processing")
            try:
                setup_step.process()
            except Exception as err:
                setup_step.state = SetupState.ERROR
                setup_step.log("Exception: {err}".format(err=str(err)))

        # If step is not COMPLETED either from this execution or a prior
        # one, then it could be in USERWAIT, STAFFWAIT or FAIL
        # at which point we should stop processing the queue
        if setup_step.state != SetupState.COMPLETED:
            raise StepExecuteException(setup_step)

    # If execution was not interrupted, make setup_complete true
    user.profile.setup_complete = True
    user.profile.save()
    log_setup_state(
        user, 
        "{user} setup is now complete".format(
            user=user.username
        )
    )