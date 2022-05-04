"""
..: module:: apps.workspace.managers.user_applications
   : synopsis: Manager handling user's cloned applications and systems
"""
import logging

from requests.exceptions import HTTPError

from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings

from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.models.applications import Application
from portal.apps.workspace.managers.base import AbstractApplicationsManager
from portal.apps.accounts.managers.user_systems import UserSystemsManager

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class UserApplicationsManager(AbstractApplicationsManager):
    """User Applications Manager

    Class that provides workflows to clone apps and execution systems for a user.

    """

    def __init__(self, *args, **kwargs):
        super(UserApplicationsManager, self).__init__(*args, **kwargs)
        self.user_systems_mgr = UserSystemsManager(self.user)

    def get_clone_system_id(self):
        """Gets system id to deploy cloned app materials to.

        *System Id* is a string, unique id for each system.
        This function returns the system id for a user's home system.

        :returns: System unique id
        :rtype: str
        """

        sys_id = self.user_systems_mgr.get_system_id()
        return sys_id

    def get_application(self, appId):
        """Gets an application

        :param str appId: Unique id of the application

        :returns: Application instance
        :rtype: class Application
        """

        app = Application(self.client, id=appId)
        return app

    def check_app_for_updates(self, cloned_app, host_app_id=None, host_app=None):
        """Checks cloned app for updates against host app by comparing the revision
        of the host app to the 'cloneRevision' tag inserted into the cloned apps tags.

        :param cloned_app: Application instance of the cloned application
        :param host_app_id: Agave id of the host application
        :param host_app: Application instance of the host application

        :returns: update_required
        :rtype: bool
        """
        update_required = False

        # compare cloned app revision number to original app revision number
        if not host_app:
            host_app = self.get_application(host_app_id)

        logger.debug('Looking for revision match in tags for app def: {}'.format(cloned_app.to_dict()))
        # find revision number in tags
        tag_match = [s for s in cloned_app.tags if 'cloneRevision' in s]
        if not tag_match:
            logger.error('No cloneRevision in tags, app should be updated to ensure consistency.')
            update_required = True
        else:
            try:
                clone_rev = int(tag_match[0].split(':')[1])
                if clone_rev != host_app.revision:
                    logger.warning('Cloned app revision does not match host: {} != {}'.format(
                        clone_rev,
                        host_app.revision
                    ))
                    update_required = True
            except ValueError as exc:
                logger.exception('cloneRevision in tags cannot be converted to integer, app should be updated to ensure consistency. %s', exc)
                update_required = True

        return update_required

    def get_or_create_cloned_app_exec_system(self, host_exec_id, allocation):
        host_exec = ExecutionSystem(self.client, host_exec_id)
        host_exec_user_role = host_exec.roles.for_user(username=self.user.username)
        if host_exec_user_role and host_exec_user_role.role == 'OWNER':
            cloned_exec_sys = host_exec
            logger.debug('Using current execution system {}'.format(cloned_exec_sys.id))
        else:
            cloned_exec_id = '{username}.{allocation}.exec.{resource}.{execType}.{revision}'.format(
                username=self.user.username.replace('_', '-'),
                allocation=allocation,
                resource=host_exec.login.host.replace('.tacc.utexas.edu', ''),
                execType=host_exec.execution_type,
                revision=host_exec.revision
            )
            logger.debug('Getting cloned execution system: {}'.format(cloned_exec_id))
            cloned_exec_sys = self.get_or_create_exec_system(cloned_exec_id, host_exec.id, allocation)
        return cloned_exec_sys

    def clone_application(self, allocation, cloned_app_name, host_app_id=None, host_app=None):
        """Clones an application given a host app, allocation, and target name.

        ..note: checks if cloned Execution System already exists for user,
        and creates it if not.

        :param str allocation: Project allocation
        :param str cloned_app_name: Name of application clone
        :param str host_app_id: Agave id of host app
        :param host_app: Application instance of host app

        :returns: Application instance
        :rtype: class Application
        """
        if not host_app:
            host_app = self.get_application(host_app_id)

        logger.debug('Starting process to clone new application for user with id: {}-{}.0'.format(
            cloned_app_name,
            host_app.revision))

        cloned_exec_sys = self.get_or_create_cloned_app_exec_system(host_app.execution_system, allocation)

        cloned_depl_path = '.APPDATA/{appName}-{rev}.0'.format(
            appName=cloned_app_name,
            rev=host_app.revision
        )

        logger.debug('Cloning app id {}-{} with exec sys {} at path {} on deployment sys {}'.format(
            cloned_app_name,
            host_app.revision,
            cloned_exec_sys.id,
            cloned_depl_path,
            self.get_clone_system_id(),
        ))
        cloned_app = host_app.clone(self.client,
                                    depl_path=cloned_depl_path,
                                    exec_sys=cloned_exec_sys.id,
                                    depl_sys=self.get_clone_system_id(),
                                    name=cloned_app_name,
                                    ver='{}.0'.format(host_app.revision)
                                    )

        # add host revision number to cloned app's tags
        cloned_app.tags.append('cloneRevision:{}'.format(host_app.revision))
        cloned_app.update()

        # if system needs keys, pass system along with app object to instantiate push keys modal
        if hasattr(cloned_exec_sys, 'needs_keys'):
            cloned_app.exec_sys = cloned_exec_sys

        return cloned_app

    def get_or_create_cloned_app(self, host_app, allocation, cloned_execution_system):
        """Gets or creates a cloned app for the user.

        Generates a cloned app id and tries to fetch that app.
        If the app exists, check for updates.

        If app does not exist, clone the host app to cloned app id.

        :param host_app: Application instance of host app
        :param str allocation: Project allocation for app to be run on
        :param ExecutionSystem cloned_execution_system: Cloned execution system

        :returns: Application instance
        :rtype: class Application
        """

        # cloned_app_name is of the form 'prtl.clone.sal.PT2050-DataX.compress-0.1u1'
        # NOTE: host revision # will be appended to cloned_app_id, e.g. prtl.clone.sal.PT2050-DataX.compress-0.1u1-2.0
        cloned_app_name = 'prtl.clone.{username}.{allocation}.{appId}'.format(
            username=self.user.username,
            allocation=allocation,
            appId=host_app.id
        )

        cloned_app_id = '{appId}-{rev}.0'.format(
            appId=cloned_app_name,
            rev=host_app.revision)
        try:
            cloned_app = self.get_application(cloned_app_id)

            logger.debug('Cloned app {} found. Checking for updates...'.format(cloned_app_id))

            if cloned_app.execution_system != cloned_execution_system.id:
                logger.info("Cloned app {} has outdated execution system ('{}' != '{}'). Recreating...".format(
                    cloned_app_id, cloned_app.execution_system, cloned_execution_system.id))
                cloned_app.delete()
                cloned_app = self.clone_application(allocation, cloned_app_name, host_app=host_app)
                return cloned_app

            if not cloned_app.available:
                logger.info('Cloned app {} is unavailable. Recreating...'.format(cloned_app_id))
                cloned_app.delete()
                cloned_app = self.clone_application(allocation, cloned_app_name, host_app=host_app)
                return cloned_app

            if not host_app.is_public:
                update_required = self.check_app_for_updates(cloned_app, host_app=host_app)
                if update_required:
                    # Need to update cloned app by deleting and re-cloning
                    logger.warning('Cloned app is being updated (i.e. deleted and re-cloned)')
                    cloned_app.delete()
                    cloned_app = self.clone_application(allocation, cloned_app_name, host_app=host_app)
                else:
                    logger.debug('Cloned app is current with host.')

            return cloned_app

        except HTTPError as exc:
            if exc.response.status_code == 404:
                logger.debug('No app found with id {}. Cloning app...'.format(cloned_app_id))
                cloned_app = self.clone_application(allocation, cloned_app_name, host_app=host_app)
                return cloned_app
            else:
                raise

    def get_or_create_app(self, appId, allocation):
        """Gets or creates application for user.

        If application selected is owned by user, return the app,
        else clone the app to the same exec system with the
        specified allocation.

        ..note: Entry point.

        :param str appId: Agave id of application selected to run
        :param str allocation: Project alloction for app to run on

        :returns: Application instance
        :rtype: class Application
        """

        host_app = self.get_application(appId)

        # if app is owned by user, no need to clone
        if host_app.owner == self.user.username:
            logger.info('User is app owner, no need to clone. Returning original app.')
            app = host_app
            exec_sys = ExecutionSystem(self.client, app.execution_system, ignore_error=None)
        else:
            exec_sys = self.get_or_create_cloned_app_exec_system(host_app.execution_system, allocation)
            app = self.get_or_create_cloned_app(host_app, allocation, exec_sys)

        # Check if app's execution system needs keys reset and pushed
        if not app.exec_sys:
            sys_ok, res = exec_sys.test()
            if not sys_ok and (exec_sys.owner == self.user.username):
                logger.debug(res)
                logger.info('System {} needs new keys.'.format(exec_sys.id))
                app.exec_sys = exec_sys

        return app

    def clone_execution_system(self, host_system_id, new_system_id, alloc):
        """Clone execution system for user.

        :param str host_system_id: Agave id of host execution system
        :param str new_system_id: id for system clone
        :param str alloc: Project allocation for system's custom directives

        :returns: ExecutionSystem instance
        :rtype: ExecutionSystem
        """

        clone_body = {
            'action': 'CLONE',
            'id': new_system_id
        }

        cloned_sys = self.client.systems.manage(body=clone_body, systemId=host_system_id)

        sys = self.validate_exec_system(cloned_sys['id'], alloc)

        return sys

    def set_system_definition(
            self,
            system_id,
            allocation
    ):  # pylint:disable=arguments-differ
        """Initializes Agave execution system

        :param class system_id: ExecutionSystem ID
        :param str allocation: Project allocation for customDirectives

        :returns: ExecutionSystem instance
        :rtype: class ExecutionSystem
        """
        system = self.get_exec_system(system_id)

        if not system.available:
            system.enable()

        storage_settings = {}
        exec_settings = {}
        for host, val in settings.PORTAL_EXEC_SYSTEMS.items():
            if host in system.storage.host:
                storage_settings = val
            if host in system.login.host:
                exec_settings = val

        system.site = settings.PORTAL_DOMAIN
        system.name = "Execution system for user {}".format(self.user.username)
        system.storage.home_dir = storage_settings['home_dir'].format(
            self.user_systems_mgr.get_private_directory()) if 'home_dir' in storage_settings else ''
        system.storage.port = system.login.port
        system.storage.root_dir = '/'
        system.storage.auth.username = self.user.username
        system.storage.auth.type = system.AUTH_TYPES.SSHKEYS
        system.login.auth.username = self.user.username
        system.login.auth.type = system.AUTH_TYPES.SSHKEYS
        system.work_dir = '/work/{}'.format(self.user_systems_mgr.get_private_directory())
        system.scratch_dir = exec_settings['scratch_dir'].format(
            self.user_systems_mgr.get_private_directory()) if 'scratch_dir' in exec_settings else ''

        if system.scheduler == 'SLURM':
            for queue in system.queues.all():
                if queue.custom_directives:
                    queue.custom_directives = '-A {}'.format(allocation)
        return system

    def validate_exec_system(self, system_id, alloc, *args, **kwargs):
        """Validate execution system and generate keys for it

        :param system_id: Agave system id
        :param alloc: Project allocation for system

        :returns: ExecutionSystsem instance
        :rtype: class ExecutionSystem
        """

        system = self.set_system_definition(
            system_id,
            alloc
        )

        # NOTE: Check if host keys already exist for user for both login and storage hosts
        for auth_block in [system.login, system.storage]:
            try:
                keys = self.user.ssh_keys.for_hostname(hostname=auth_block.host)
                priv_key_str = keys.private_key()
                publ_key_str = keys.public
                auth_block.auth.public_key = publ_key_str
                auth_block.auth.private_key = priv_key_str
            except ObjectDoesNotExist:
                system.needs_keys = True
                auth_block.auth.public_key = 'public_key'
                auth_block.auth.private_key = 'private_key'

        system.update()

        return system

    def get_exec_system(self, systemId, *args, **kwargs):
        """Gets an execution system

        :param systemId: Agave Execution system id

        :returns: ExecutionSystem instance
        :rtype: class ExecutionSystem
        """

        exec_sys = ExecutionSystem(self.client, systemId, ignore_error=None)
        return exec_sys

    def get_or_create_exec_system(self, clonedSystemId, hostSystemId, alloc, *args, **kwargs):
        """Gets or creates user's execution system

        :param str clonedSystemId: Agave id of new system to be created
        :param str hostSystemId: Agave id of host system to clone from
        :param str alloc: Project allocation for system

        :returns: Agave response for the system
        """
        try:
            exec_sys = self.get_exec_system(clonedSystemId)
            if not exec_sys.available:
                exec_sys = self.validate_exec_system(exec_sys.id, alloc)
            logger.debug('Execution system found')
            return exec_sys
        except HTTPError as exc:
            if exc.response.status_code == 404:
                logger.debug('No execution system found, cloning system')
                exec_sys = self.clone_execution_system(hostSystemId, clonedSystemId, alloc)
                return exec_sys
