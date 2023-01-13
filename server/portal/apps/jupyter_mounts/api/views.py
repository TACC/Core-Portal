
from portal.utils.decorators import agave_jwt_login
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from portal.views.base import BaseApiView
from portal.apps.projects.managers.base import ProjectsManager
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
        mgr = ProjectsManager(user)
        projects = mgr.list()
        result = []
        names = []
        for project in projects:
            name = project.description
            # Resolve project name collisions
            if any([existing == name for existing in names]):
                name = "{name} ({id})".format(name=project.description, id=project.storage.id)
            names.append(name)

            # Find a matching role, or return None
            role = next(
                (role.role for role in project.roles.roles if role.username == user.username),
                None
            )
            if role == "OWNER" or role == "ADMIN":
                permissions = "rw"
            elif role == "GUEST":
                permissions = "ro"
            else:
                permissions = "ro"

            result.append(
                {
                    "path": project.absolute_path,
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
