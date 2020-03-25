
from mock import MagicMock
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.abstract import AbstractStep


class MockStep(AbstractStep):
    """
    Fixture for testing AbstractStep, that
    simply calls spy methods
    """

    def __init__(self, user):
        self.prepare_spy = MagicMock()
        super(MockStep, self).__init__(user)

    def display_name(self):
        return "Mock Step"

    def prepare(self):
        self.prepare_spy()


class MockProcessingCompleteStep(AbstractStep):
    """
    Fixture for testing automated processing steps that complete successfully
    """

    def __init__(self, user):
        super(MockProcessingCompleteStep, self).__init__(user)
        self.process_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Pending")

    def display_name(self):
        return "Mock Processing Complete Step"

    def process(self):
        self.complete("Completed")
        self.process_spy()


class MockProcessingFailStep(AbstractStep):
    """
    Fixture for testing automated processing steps that fail
    """

    def __init__(self, user):
        super(MockProcessingFailStep, self).__init__(user)
        self.process_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Pending")

    def display_name(self):
        return "Mock Processing Fail Step"

    def process(self, webhook_data=None):
        self.fail("Failure")
        self.process_spy()


class MockUserStep(AbstractStep):
    """
    Fixture for testing steps that block for client action
    from the user
    """

    def __init__(self, user):
        super(MockUserStep, self).__init__(user)
        self.client_action_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.USERWAIT
        self.log("Waiting for user")

    def display_name(self):
        return "Mock User Wait Step"

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user is self.user:
            self.complete("Complete")
            self.client_action_spy(action, data, request)


class MockStaffStep(AbstractStep):
    """
    Fixture for testing AbstractStaffSteps
    """

    def __init__(self, user):
        super(MockStaffStep, self).__init__(user)
        self.staff_approve_spy = MagicMock()
        self.staff_deny_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.STAFFWAIT
        self.log("Waiting for staff")

    def display_name(self):
        return "Mock Staff Wait Step"

    def client_action(self, action, data, request):
        if not request.user.is_staff:
            return

        if action == "staff_approve":
            self.complete(
                "Approved by {user}".format(
                    user=request.user.username
                )
            )
            self.staff_approve_spy(action, data, request)
        elif action == "staff_deny":
            self.fail(
                "Denied by {user}".format(
                    user=request.user.username
                )
            )
            self.staff_deny_spy(action, data, request)


class MockWebhookStep(AbstractStep):
    """
    Fixture for testing webhook steps
    """

    def __init__(self, user):
        super(MockWebhookStep, self).__init__(user)
        self.webhook_send_spy = MagicMock()
        self.webhook_callback_spy = MagicMock()

    def prepare(self):
        self.state = SetupState.STAFFWAIT
        self.log("Waiting on staff to activate")

    def client_action(self, action, data, request):
        if not request.user.is_staff:
            return

        if action == "staff_approve":
            self.state = SetupState.WEBHOOK
            callback_url = self.webhook_url(request)
            self.log(
                "Staff user {staff} sending webhook call with callback url {url}".format(
                    staff=request.user.username,
                    url=callback_url
                )
            )
        self.webhook_send_spy(action, data, request, callback_url)

    def webhook_callback(self, webhook_data=None):
        self.complete("Webhook complete")
        self.webhook_callback_spy(webhook_data)

    def display_name(self):
        return "Webhook Step"


class MockErrorStep(AbstractStep):
    """
    Fixture for testing steps that generate exceptions
    """

    def __init__(self, user):
        super(MockErrorStep, self).__init__(user)

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Pending")

    def display_name(self):
        return "Mock Error Step"

    def process(self, webhook_data=None):
        raise Exception("MockErrorStep")


class MockInvalidStepClass:
    def __init__(self, user):
        pass


def mock_invalid_step_function():
    pass
