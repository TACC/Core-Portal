import logging

from django.conf import settings
from pytas.http import TASClient

from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class ProjectMembershipStep(AbstractStep):
    """The onboarding step checks TAS for project membership.

    This task queries TAS for user's projects.  If the user has one of the projects listed in the
    `settings.REQUIRED_PROJECTS` list of required project, then the task is complete.

    """
    def __init__(self, user):
        super(ProjectMembershipStep, self).__init__(user)

    def display_name(self):
        return "Checking project membership"

    def prepare(self):
        super(ProjectMembershipStep, self).prepare()
        self.state = SetupState.PENDING
        self.log("Pending check of project membership.")

    def process(self):
        required_projects = getattr(settings, 'REQUIRED_PROJECTS', [])

        if not required_projects:
            self.complete("No project is required for access to this portal")
            return

        try:
            tas_client = TASClient(
                baseURL=settings.TAS_URL,
                credentials={
                    'username': settings.TAS_CLIENT_KEY,
                    'password': settings.TAS_CLIENT_SECRET,
                }
            )
        except Exception:
            self.fail(
                "Unable to get tas in order to get project info")
            return

        try:
            projects = tas_client.projects_for_user(username=self.user.username)

        except Exception as e:
            logger.error('Unable to get projects for using pytas for {}: {}'.format(self.user.username, e.message))
            self.fail("Unable to get projects for user")
            return

        has_required_project = any(p['chargeCode'] in required_projects for p in projects)

        if has_required_project:
            logger.info("User is on a required project")
            self.complete("You are on a required project needed to access this portal")
        else:
            logger.warning("User '{}' is not a member of required project ({})".format(self.user.username,
                                                                                       required_projects))
            self.fail("You must be added to one of the required project(s) "
                      "(e.g. {}) in order to access this portal".format(", ".join(required_projects)))
