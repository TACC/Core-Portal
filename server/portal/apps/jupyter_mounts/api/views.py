
from portal.utils.decorators import agave_jwt_login
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from portal.views.base import BaseApiView
from portal.apps.projects.workspace_operations.shared_workspace_operations import list_projects, get_workspace_role
from portal.apps.users.utils import get_user_data

import logging


logger = logging.getLogger(__name__)


@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(login_required, name='dispatch')
class JupyterMountsApiView(BaseApiView):
    """JupyterMountsApiView

    This API returns a list of mount definitions for JupyterHub
    """
    def getDatafilesStorageSystems(self):
        result = []
        for system in [sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if sys['api'] == 'tapis' and
                       (sys['scheme'] == 'community' or sys['scheme'] == 'public')]:
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

    def getLocalStorageSystems(self, user):
        result = []
        tasdir = get_user_data(user.username)['homeDirectory']
        for system in [sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if sys['api'] == 'tapis' and sys['scheme'] == 'private']:
            try:
                result.append(
                    {
                        "path": system['homeDir'].format(tasdir=tasdir, username=user.username),
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

    def getProjectSystems(self, user):
        projects = list_projects(user.tapis_oauth.client)
        print(projects)
        result = []
        names = []
        for project in projects:
            name = project["title"]
            # Resolve project name collisions
            if any([existing == name for existing in names]):
                name = "{name} ({id})".format(name=project["title"], id=project["id"])
            names.append(name)
            role = get_workspace_role(user.tapis_oauth.client, project["name"], user.username)

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
        mounts = self.getDatafilesStorageSystems() + \
            self.getLocalStorageSystems(request.user) + \
            self.getProjectSystems(request.user)
        return JsonResponse(mounts, safe=False)
