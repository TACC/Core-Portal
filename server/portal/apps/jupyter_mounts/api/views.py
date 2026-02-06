from portal.utils.decorators import agave_jwt_login
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from portal.apps.auth.models import TapisOAuthToken
from portal.views.base import BaseApiView
from portal.apps.projects.workspace_operations.shared_workspace_operations import list_projects, get_workspace_role
from portal.apps.datafiles.utils import evaluate_datafiles_storage_systems

import logging


logger = logging.getLogger(__name__)


@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(login_required, name='dispatch')
class JupyterMountsApiView(BaseApiView):
    """JupyterMountsApiView

    This API returns a list of mount definitions for JupyterHub
    """
    def getDatafilesStorageSystems(self, tapis_oauth: TapisOAuthToken) -> list:
        result = []
        non_private_systems = [
            sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
            if sys['api'] == 'tapis' and (sys['scheme'] == 'community' or sys['scheme'] == 'public')
        ]
        for system in evaluate_datafiles_storage_systems(tapis_oauth, non_private_systems):
            try:
                result.append(
                    {
                        "path": system.get("homeDir", "/"),
                        "mountPath": "/{namespace}/{name}".format(
                            namespace=settings.PORTAL_NAMESPACE,
                            name=system['name']
                        ),
                        "pems": "ro"
                    }
                )
            except Exception:
                logger.exception("Could not retrieve system {}".format(system))
        return result

    def getLocalStorageSystems(self, tapis_oauth: TapisOAuthToken) -> list:
        result = []
        private_tapis_systems = [
            sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
            if sys['api'] == 'tapis' and sys['scheme'] == 'private'
        ]
        for system in evaluate_datafiles_storage_systems(
            tapis_oauth, private_tapis_systems
        ):
            try:
                result.append(
                    {
                        "path": system['homeDir'],
                        "mountPath": "/{namespace}/{name}".format(
                            namespace=settings.PORTAL_NAMESPACE,
                            name=system['name']
                        ),
                        "pems": "rw"
                    }
                )
            except Exception:
                logger.exception("Could not retrieve system {}".format(system))
        return result

    def getProjectSystems(self, tapis_oauth: TapisOAuthToken) -> list:
        projects = list_projects(tapis_oauth.client)
        result = []
        names = []
        for project in projects:
            name = project["title"]
            # Resolve project name collisions
            if any([existing == name for existing in names]):
                name = "{name} ({id})".format(name=project["title"], id=project["id"])
            names.append(name)
            role = get_workspace_role(tapis_oauth.client, project["name"], tapis_oauth.user.username)

            if role == "OWNER" or role == "USER":
                permissions = "rw"
            elif role == "GUEST":
                permissions = "ro"
            else:
                permissions = "ro"

            result.append(
                {
                    "path": project["path"],
                    "mountPath": "/{namespace}/My Projects/{name}".format(
                        namespace=settings.PORTAL_NAMESPACE,
                        name=name),
                    "pems": permissions
                }
            )
        return result

    def get(self, request):
        tapis_oauth = request.user.tapis_oauth
        mounts = self.getDatafilesStorageSystems(tapis_oauth) + \
            self.getLocalStorageSystems(tapis_oauth) + \
            self.getProjectSystems(tapis_oauth)
        return JsonResponse(mounts, safe=False)
