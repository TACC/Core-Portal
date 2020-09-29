from abc import ABCMeta, abstractmethod
from six import add_metaclass
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from django.urls import reverse


@add_metaclass(ABCMeta)
class AbstractStep:
    """
    An abstract class that allows user setup steps to be structured
    with a state machine.
    """

    def __init__(self, user):
        self.state = None
        self.user = user
        self.last_event = None
        self.events = []

        try:
            # Restore event history
            self.events = [
                event for event in SetupEvent.objects.filter(
                    user=user,
                    step=self.step_name()
                ).order_by('time')
            ]
            self.last_event = self.events[-1] if len(self.events) > 0 else None
            self.state = self.last_event.state
        except Exception:
            pass

    def log(self, message, data=None):
        """
        Log current state of setup step. This must be called by subclasses and any method that
        needs to set the state of the setup step for this user.
        """
        self.last_event = SetupEvent.objects.create(
            user=self.user,
            step=self.step_name(),
            state=self.state,
            message=message,
            data=data
        )
        self.last_event.save()
        self.events.append(self.last_event)

    def fail(self, message, data=None):
        """
        Mark this setup step as failed.
        """
        self.state = SetupState.FAILED
        self.log(message, data)

    def complete(self, message, data=None):
        """
        Mark this setup step as completed
        """
        self.state = SetupState.COMPLETED
        self.log(message, data)

    def webhook_url(self, request):
        """
        Utility function for getting a webhook callback url
        """
        return request.build_absolute_uri(reverse('webhooks:onboarding_wh_handler'))

    def __str__(self):
        return "<{step} for {username} is {state}>".format(
            step=self.step_name(),
            state=self.state,
            username=self.user.username
        )

    def step_name(self):
        return "{module}.{classname}".format(
            module=self.__module__,
            classname=self.__class__.__name__
        )

    @abstractmethod
    def display_name(self):
        """
        Called when displaying this step in the client. Should return a string
        that is a friendly name that describes a step.
        """
        return NotImplemented

    @abstractmethod
    def prepare(self):
        """
        Called during profile setup in core_apps_accounts.managers.accounts.setup
        if no log data exists for this step. Child implementations should perform
        any pre-processing, then set state to PENDING, USERWAIT or STAFFWAIT and
        call self.log with a message to save this state.

        Also called when a staff user invokes the reset action from the client
        """
        return NotImplemented

    def client_action(self, action, data, request):
        """
        Called by portal.apps.onboarding.api.views.SetupStepView.post

        Child implementations should override this to handle interactions with
        the front-end client, and should call complete, fail, or log.
        The child implementation should check the identity of request.user before
        allowing execution of an action

        ..param: action can be "user_confirm" | "staff_approve" | "staff_deny"
        """
        pass

    def webhook_action(self, webhook_data=None):
        """
        Called by portal.apps.onboarding.api.webhook.SetupStepWebhookView.post

        Child implementations should override this to handle webhook callbacks
        """
        pass

    def process(self):
        """
        Called by portal.apps.onboarding.execute.execute_setup_steps if
        state is SetupState.PENDING. execute_setup_steps will put the step
        in the PROCESSING state before this method is called.

        Child implementations should override this to handle long processing
        calls.
        """
        pass
