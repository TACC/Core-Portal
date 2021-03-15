
from portal.utils.decorators import agave_jwt_login
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from portal.views.base import BaseApiView
from portal.libs.agave.utils import service_account
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.apps.projects.managers.base import ProjectsManager

import logging


logger = logging.getLogger(__name__)


@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(login_required, name='dispatch')
class JupyterMountsApiView(BaseApiView):
    """JupyterMountsApiView

    This API returns a list of mount definitions for JupyterHub
    """
    def getDatafilesStorageSystems(self):
        agave = service_account()
        result = []
        for system in (sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if sys['api'] == 'tapis'):
            try:
                sys_def = agave.systems.get(systemId=system['system'])
                result.append(
                    {
                        "path": sys_def["storage"]["rootDir"],
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
        for system in settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS.keys():
            try:
                sys_def = UserSystemsManager(user, system_name=system)
                result.append(
                    {
                        "path": sys_def.get_sys_tas_user_dir(),
                        "mountPath": "/{namespace}/{name}".format(
                            namespace=settings.PORTAL_NAMESPACE,
                            name=sys_def.get_name()
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
