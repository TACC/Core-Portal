"""Management command."""

from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand
from portal.apps.projects.models.base import ProjectId
from portal.apps.projects.models.utils import get_latest_project_storage, get_latest_project_directory


class Command(BaseCommand):
    """Manage project latest project id

    Examples:

        Discover what the current latest project ids are:

        >>> ./manage.py projects_id

        Update the project id to a specific number:

        >>> ./manage.py projects_id --update 42

        Update the project id to something safe:

        >>> ./manage.py projects_id --update-using-max-value-found

        Update the project id to something safe but don't look for a safe value above 1000000. This could be used if
        you had previously set the max project id to something super larger (like 1000000) for testing purposes but now
        want to revert to a safe (but lower) project id.

        >>> ./manage.py projects_id --update-using-max-value-found --max-project-id 1000000

    """
    help = (
        'Manage projects latest project id. By default this command will print '
        'the current latest project id, the last project id used in '
        'storage systems, and the last project id used in folders created.'
    )

    def add_arguments(self, parser):
        """Add arguments."""
        update_group = parser.add_mutually_exclusive_group()
        update_group.add_argument(
            '--update',
            action='store',
            type=int,
            help='Update project id DB value.'
        )
        update_group.add_argument(
            '--update-using-max-value-found',
            action='store_true',
            help='Update project id DB value using value derived from latest storage system project id or latest '
                 'directory project id (whichever is higher).'
        )
        parser.add_argument(
            '--max-project-id',
            action='store',
            type=int,
            help='Ignore project ids larger than a certain value'
        )

    def handle(self, *args, **options):
        """Handle command."""
        max_project_id = options["max_project_id"]
        if max_project_id:
            self.stdout.write('NOTE(!!!!): Ignoring project ids >= {} when '
                              'processing/updating the storage systems and directories'.format(max_project_id))

        latest_storage_system_id = get_latest_project_storage(max_project_id=max_project_id)
        latest_project_id = get_latest_project_directory(max_project_id=max_project_id)

        if latest_storage_system_id == -1:
            self.stdout.write('There are no project storage systems.')
        if latest_project_id == -1:
            self.stdout.write('There are no project directories.')

        self.stdout.write('Latest storage system project id: {}'.format(latest_storage_system_id))
        self.stdout.write('Latest directory project id: {}'.format(latest_project_id))

        try:
            with transaction.atomic():
                model_project_id = ProjectId.objects.select_for_update().latest('last_updated').value
            self.stdout.write('Latest project id in ProjectId model: {}'.format(model_project_id))
        except ObjectDoesNotExist:
            self.stdout.write('Latest project id in ProjectId model: None')

        if options.get('update'):
            self.stdout.write('Updating to user provided value of: {}'.format(options.get('update')))
            ProjectId.update(options.get('update'))
        elif options["update_using_max_value_found"]:
            max_value_found = max(latest_storage_system_id, latest_project_id, 0)
            self.stdout.write('Updating to value latest storage system id: {}'.format(max_value_found))
            ProjectId.update(max_value_found)
