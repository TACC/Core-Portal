from django.core.management.base import BaseCommand
from portal.apps.system_creation.utils import (
    force_create_storage_system
)
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

        force_create_storage_system(username)
