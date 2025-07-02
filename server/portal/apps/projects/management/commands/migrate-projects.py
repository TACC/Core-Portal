"""Management command."""

from django.core.management.base import BaseCommand
from portal.libs.agave.utils import service_account
from portal.apps.projects.models.base import Project
from portal.apps.projects.models.metadata import LegacyProjectMetadata
from portal.apps.search.tasks import index_project
from django.contrib.auth import get_user_model
import logging


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Command class."""

    help = (
        'Reconcile projects from CEPv1 migration that do not have '
        'a PI assigned. This will attempt to assign the creator of '
        'these projects as PI, as well as index all projects.'
    )

    def handle(self, *args, **options):
        """Handle command."""
        agc = service_account()
        metadatas = LegacyProjectMetadata.objects.all()
        for meta in metadatas:
            if not meta.pi:
                try:
                    project = Project(agc, meta.project_id)
                    storage = project.storage
                    roles = storage.roles.to_dict().items()
                    admins = list(
                        filter(
                            lambda role_tuple: role_tuple[0] != 'wma_prtl' and (role_tuple[1] == 'ADMIN' or role_tuple[1] == 'OWNER'),
                            roles
                        )
                    )
                    if len(admins) != 1:
                        raise Exception("Not exactly one admin for {project_id}".format(project_id=meta.project_id))
                    # Get first role tuple, first item in tuple which is username
                    admin = get_user_model().objects.get(username=admins[0][0])
                    project.add_pi(admin)
                    logger.info("Set {admin} as PI on {project_id}".format(
                        admin=admin.username,
                        project_id=meta.project_id
                    ))

                except Exception as e:
                    logger.error("Could not migrate {project_id}".format(project_id=meta.project_id))
                    logger.exception(e)

            index_project.apply_async(args=[meta.project_id])
