from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from portal.apps.tas_project_systems.utils import (
    create_all_tas_project_systems,
    create_systems_for_tas_project
)
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
            '-p', '--project_sql_id',
            type=int,
            required=False,
            help="Force creation of a specific project sql ID (specified user must still be on this TAS project"
        )

    def handle(self, *args, **options):
        """Handle command."""
        username = options.get('username')
        project_sql_id = options.get('project_sql_id')

        user, created = get_user_model().objects.get_or_create(username=username)

        if created:
            logger.warn("Username {} does not exist locally, creating a virtual user".format(username))

        if project_sql_id is not None:
            create_systems_for_tas_project.apply_async(args=[username, project_sql_id])
        else:
            create_all_tas_project_systems.apply_async(args=[username])
