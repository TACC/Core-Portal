import logging
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from pytas.http import TASClient


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class ApcdMembershipStep(AbstractStep):
    """
    Configuration:

    _PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.apcd_membership.ApcdMembershipStep',
            'settings': {
                'project_sql_id': 57734,
                'userlink': {
                    'url': '/',
                    'text': 'Request Access'
                },
                'retry': True
            }
        }
    ]
    """
    def __init__(self, user):
        """
        Call super class constructor
        """
        super(ApcdMembershipStep, self).__init__(user)
        self.project = self.get_tas_project()
        self.user_confirm = "Request Project Access"
        self.staff_approve = "Add to {project}".format(project=self.project['title'])
        self.staff_deny = "Deny Project Access Request"

    def get_tas_client(self):
        tas_client = TASClient(
            baseURL=settings.TAS_URL,
            credentials={
                'username': settings.TAS_CLIENT_KEY,
                'password': settings.TAS_CLIENT_SECRET
            }
        )
        return tas_client

    def get_tas_project(self):
        return self.get_tas_client().project(self.settings['project_sql_id'])

    def description(self):
        return """This confirms if you have access to the project. If not, request access and
                  wait for the system administrator’s approval."""

    def display_name(self):
        return "Checking Project Membership"

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting project membership check")

    def is_project_member(self):
        username = self.user.username
        tas_client = self.get_tas_client()
        project_users = tas_client.get_project_users(self.settings['project_sql_id'])
        return any([u['username'] == username for u in project_users])

    def process(self):
        if self.is_project_member():
            self.complete("You have the required project membership to access this portal.")
        else:
            self.state = SetupState.USERWAIT
            data = {}
            if self.settings is not None and 'userlink' in self.settings:
                data['userlink'] = self.settings['userlink']
            self.log(
                "Please make a request to use this portal.",
                data=data
            )
