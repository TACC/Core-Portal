"""Management command."""

from django.conf import settings
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand
from portal.libs.agave.utils import service_account
from portal.apps.projects.models.base import ProjectId, Project
from portal.libs.agave.operations import iterate_listing


def get_latest_project_storage(max_project_id=None):
    """Get latest agave project storage.

    :param max_project_id: If provided, then ignore projects ids that are greater than or equal to this value.
    """
    offset = 0
    limit = 1000
    latest = -1
    all_projects = []
    while True:
        prjs = [p for p in Project.listing(
            service_account(),
            offset=offset,
            limit=limit
        )]
        all_projects += prjs
        offset += limit
        if len(prjs) < limit:
            break

    for prj in all_projects:
        prj_id = prj.storage.id.replace(
            settings.PORTAL_PROJECTS_SYSTEM_PREFIX,
            ''
        )
        if '-' not in prj_id:
            continue
        _, prj_id = prj_id.rsplit('-')
        prj_id = int(prj_id)

        if prj_id > latest and (max_project_id is None or prj_id < max_project_id):
            latest = prj_id

    return latest


def get_latest_project_directory(max_project_id=None):
    """Get latest agave project directory.

    :param max_project_id: If provided, then ignore projects ids that are greater than or equal to this value.
    """
    latest = -1
    for f in iterate_listing(service_account(),
                             system=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
                             path='/'):
        name = f["name"]
        if '-' not in name or not name.startswith(settings.PORTAL_PROJECTS_ID_PREFIX):
            continue
        _, dir_id = name.rsplit('-', 1)
        dir_id = int(dir_id)
        if dir_id > latest and (max_project_id is None or dir_id < max_project_id):
            latest = dir_id
    return latest


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
            latest_storage_system_id = 0 if latest_storage_system_id == -1 else latest_storage_system_id
            self.stdout.write('Updating to value latest storage system id: {}'.format(latest_storage_system_id))
            ProjectId.update(latest_storage_system_id)
