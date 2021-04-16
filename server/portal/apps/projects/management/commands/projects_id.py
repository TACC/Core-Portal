"""Management command."""

from django.conf import settings
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand
from portal.libs.agave.utils import service_account
from portal.apps.projects.models.base import ProjectId, Project
from portal.libs.agave.operations import iterate_listing


class Command(BaseCommand):
    help = (
        'Manage projects latest project id. By default this command will print '
        'the current latest project id, the last project id used in '
        'storage systems, and the last project id used in folders created.'
    )

    @staticmethod
    def get_latest_project_storage(ignore_above_value=None):
        """Get latest agave project storage.

        :param ignore_above_value: If provided, then ignore projects ids that are greater than or equal to this value.
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
                settings.PORTAL_PROJECTS_NAME_PREFIX,
                ''
            )
            if '-' not in prj_id:
                continue
            _, prj_id = prj_id.rsplit('-')
            prj_id = int(prj_id)

            if prj_id > latest and (ignore_above_value is None or prj_id < ignore_above_value):
                latest = prj_id


        return latest

    @staticmethod
    def get_latest_project_directory(ignore_above_value=None):
        """Get latest agave project directory.

        :param ignore_above_value: If provided, then ignore projects ids that are greater than or equal to this value.
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
            if dir_id > latest and (ignore_above_value is None or dir_id < ignore_above_value):
                latest = dir_id
        return latest

    def add_arguments(self, parser):
        """Add arguments."""
        parser.add_argument(
            '--update',
            action='store',
            type=int,
            help='Update project id DB value.'
        )
        parser.add_argument(
            '--update-using-storage-system-id',
            action='store_true',
            help='Update project id DB value using value derived from latest storage system project id.'
        )
        parser.add_argument(
            '--ignore-large-project-ids',
            action='store',
            type=int,
            help='Ignore project ids larger than a certain value'
        )

    def handle(self, *args, **options):
        """Handle command."""
        ignore_large_ids = options["ignore_large_project_ids"]
        if ignore_large_ids:
            self.stdout.write('NOTE(!!!!): Ignoring project ids >= {} when '
                              'processing/updating the storage systems and directories'.format(ignore_large_ids))

        latest_storage_system_id = Command.get_latest_project_storage(ignore_above_value=ignore_large_ids)
        latest_project_id = Command.get_latest_project_directory(ignore_above_value=ignore_large_ids)

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
            if (options.get('update') or options.get('update_using_storage_system_id')):
                ProjectId.objects.create(value=1).save()

        if options.get('update'):
            self.stdout.write('Updating to user provided value of: {}'.format(options.get('update')))
            ProjectId.update(options.get('update'))
        elif options["update_using_storage_system_id"]:
            latest_storage_system_id = 0 if latest_storage_system_id == -1 else latest_storage_system_id
            self.stdout.write('Updating to value latest storage system id: {}'.format(latest_storage_system_id))
            ProjectId.update(latest_storage_system_id)
