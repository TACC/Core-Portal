from django.core.management.base import BaseCommand
from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.auth.tasks import get_user_storage_systems
from portal.apps.system_creation.utils import (
    call_reactor,
    substitute_user_variables
)
from django.contrib.auth import get_user_model
from django.conf import settings
import json
import logging


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Command class."""

    help = (
        'Force system creation via keyservice for a given user'
    )

    def add_arguments(self, parser):
        parser.add_argument('-u', '--username', type=str, required=True, help="Username")

    def handle(self, *args, **options):
        """Handle command."""
        username = options.get('username')

        user, created = get_user_model().objects.get_or_create(username=username)

        if created:
            logger.warn("Username {} does not exist locally, creating a virtual user".format(username))

        storage_systems = get_user_storage_systems(
            user.username,
            settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
        )
        logger.debug("Unpacking systems to create: {}".format(storage_systems))

        # Create a list of tuples of systemId, variables from substitute_user_variables
        substituted = [
            substitute_user_variables(user, v['systemId'], v) for k, v in storage_systems.items()
        ]

        for systemId, variables in substituted:
            result = call_reactor(
                user,
                systemId,
                'wma-storage',
                variables,
                force=True,
                dryrun=False,
                callback="portal.apps.system_creation.management.commands.force_system_creation.ForceSystemCreationCallback",
                callback_data={"systemId": systemId}
            )
            logger.info(
                "Forced System Creation reactor for {} has executionId {}".format(
                    systemId,
                    result['executionId']
                )
            )


class ForceSystemCreationCallback(WebhookCallback):
    logger = logging.getLogger(__name__)

    def __init__(self):
        super(ForceSystemCreationCallback, self).__init__()

    def callback(self, external_call, webhook_request):
        response = json.loads(webhook_request.body)
        self.logger.info("Forced System Creation of {systemId} {result}".format(
            result=response['result'],
            systemId=external_call.callback_data['systemId'],
        ))
