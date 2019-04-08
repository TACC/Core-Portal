# agavepy.actors
from agavepy.agave import Agave
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings

class AbacoStep(AbstractStep):
    def __init__(self, user):
        super(AbacoStep, self).__init__(user)

    def prepare(self):
        self.state = SetupState.STAFFWAIT
        self.log("Waiting on staff to activate Abaco actor")

    def display_name(self):
        "Call Abaco actor"

    def client_action(self, action, data, request):
        """

            send actor_id and message
            use james's token?

            {
                user: username,
                homeDirectory: tashome
                project: projectid -> alias
                system: systemname
            }

            ideally send username, callback_url and secret 
        """
        if not request.user.is_staff:
            return

        if action == "staff_confirm":
            actorId = "3rN0bMyYj3meD"
            agave = request.user.agave_oauth.client
            payload = {
                "username" : self.user.username,
                "step" : self.step_name(),
                "callback_url": self.webhook_url(request),
                "callback_secret": settings.PORTAL_USER_ACCOUNT_SETUP_WEBHOOK_PWD,
                "data" : data
            }
            agave.actors.sendMessage(actorId=actorId, message=payload)
            self.state = SetupState.WEBHOOK
            self.log(
                "Abaco actor {actorId} called by {username}".format(
                    actorId="actorID",
                    username=request.user.username
                )
            )
        elif action == "staff_deny":
            self.fail(
                "Staff {username} declined to activate actor".format(
                    username=request.user.username
                )
            )

    def webhook_callback(self, webhook_data=None):
        self.state = webhook_data["state"]
        self.log(
            webhook_data["message"],
            webhook_data["data"]
        )