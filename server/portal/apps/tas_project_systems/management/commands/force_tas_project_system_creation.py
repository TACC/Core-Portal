from django.core.management.base import BaseCommand
from portal.apps.webhooks.callback import WebhookCallback
from django.contrib.auth import get_user_model
from django.conf import settings
from portal.apps.tas_project_systems.utils import create_tas_project_systems
import logging


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Command class."""

    help = (
        'Force TAS project system creation via keyservice for a given user'
    )

    def add_arguments(self, parser):
        parser.add_argument('-u', '--username', type=str, required=True, help="Username")
        parser.add_argument(
            '-i', '--project_id',
            type=int,
            required=False,
            help="Force creation of a specific project ID (specified user must still be on this TAS project"
        )

    def handle(self, *args, **options):
        """Handle command."""
        username = options.get('username')
        force_project_id = options.get('project_id')

        user, created = get_user_model().objects.get_or_create(username=username)

        if created:
            logger.warn("Username {} does not exist locally, creating a virtual user".format(username))

        create_tas_project_systems(user, force_project_id=force_project_id)
    