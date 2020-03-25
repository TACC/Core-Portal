"""Management command."""

from django.conf import settings
from django.core.management.base import BaseCommand
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.files import BaseFile
from portal.apps.projects.models.base import ProjectId, Project


class Command(BaseCommand):
    """Command class."""

    help = (
        'Manage projects next Id. By default this command will print '
        'the current latest project id, the last project id used in '
        'storage systems and the last project id used in folders created '
        'in corral.'
    )

    def _get_latest_project_storage(self):  # pylint:disable=no-self-use
        """Get latest agave project storage."""
        offset = 0
        limit = 100
        prjs = Project.listing(
            service_account(),
            offset=offset,
            limit=limit
        )
        done = False
        latest = -1
        while not done:
            prj_id = -1
            for prj in prjs:
                prj_id = prj.storage.id.replace(
                    settings._PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX,
                    ''
                )
                if '-' not in prj_id:
                    continue
                _, prj_id = prj_id.rsplit('-')
                try:
                    prj_id = int(prj_id)
                except ValueError:
                    # prj_id is not an int
                    pass

                if prj_id > latest:
                    latest = prj_id
            if prj_id == -1:
                done = True
            else:
                offset += 100
                prjs = Project.listing(
                    service_account(),
                    offset=offset,
                    limit=limit
                )
        return latest

    def _get_latest_project_directory(self):  # pylint:disable=no-self-use
        """Get latest agave project directory."""
        offset = 0
        limit = 100
        _file = BaseFile(
            service_account(),
            system=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
            path='/'
        )
        dirs = _file.children(offset=offset, limit=limit)
        done = False
        latest = -1
        while not done:
            dir_id = -1
            for _dir in dirs:
                if ('-' not in _dir.name or
                        not _dir.name.startswith(settings.PORTAL_PROJECTS_ID_PREFIX)):
                    continue
                _, dir_id = _dir.name.rsplit('-', 1)
                try:
                    dir_id = int(dir_id)
                except ValueError:
                    # dir_id is not an int
                    pass

                if dir_id > latest:
                    latest = dir_id

            if dir_id == -1:
                done = True
            else:
                offset += 100
                _file.set_children(None)
                dirs = _file.children(offset=offset, limit=limit)
        return latest

    def add_arguments(self, parser):
        """Add arguments."""
        parser.add_argument(
            '--update',
            action='store',
            type=int,
            help='Integer to update saved DB value.'
        )

    def handle(self, *args, **options):
        """Handle command."""
        if options.get('update'):
            ProjectId.update(options.get('update'))
        else:
            latest_storage_prj_id = self._get_latest_project_storage()
            if latest_storage_prj_id == -1:
                self.stdout.write('There are no project storage systems.')
            else:
                self.stdout.write(
                    'Latest Storage Project Id: {prj_id}'.format(
                        prj_id=latest_storage_prj_id
                    )
                )
            latest_project_dir_id = self._get_latest_project_directory()
            if latest_project_dir_id == -1:
                self.stdout.write('There are no project directories.')
            else:
                self.stdout.write(
                    'Latest Directory Project Id: {dir_id}'.format(
                        dir_id=latest_project_dir_id
                    )
                )
