"""
.. module: apps.data_depot.managers.base
   :synopsis: Abstract classes to build Data Depot file managers.
"""
import logging
from abc import ABCMeta, abstractmethod, abstractproperty
from six import add_metaclass

logger = logging.getLogger(__name__)


@add_metaclass(ABCMeta)
class AbstractWorkspaceManager:
    """Abstract class describing a Manager describing the basic functionality for
    various resources needed to manage apps, e.g. Jobs, Monitors, Metadata, etc...

    .. rubric:: Rationale

    The *Workspace** should be the one place to go when a user needs to execute an
    application within the portal. These applications might live in different
    places and might be executed in different ways. These managers attempt to
    standardize this by creating a small abstraction layer.
    """

    def __init__(self, request, **kwargs):
        """Inspect the request object to initialize manager.

        :param request: Django request object.
        """
        try:
            self._ac = request.user.tapis_oauth.client
            self.username = request.user.username
        except AttributeError:
            self._ac = None
            self.username = 'AnonymousUser'

    @abstractproperty
    def requires_auth(self):
        """Check if we should check for auth"""
        return True

    @abstractmethod
    def get(self, *args, **kwargs):
        """Get single object instance"""
        return NotImplemented

    @abstractmethod
    def list(self, *args, **kargs):
        """Get list of objects"""
        return NotImplemented


@add_metaclass(ABCMeta)
class AbstractApplicationsManager:
    """Abstract class describing a Manager for a user's cloned applications
    and cloned execution systems.
    """

    def __init__(
            self,
            user,
            *args,
            **kwargs):  # pylint: disable=unused-argument
        """Initialize Manager

        :param user: Django user instance
        """
        self.user = user
        self.client = self.user.tapis_oauth.client

    @abstractmethod
    def get_clone_system_id(self, *args, **kwargs):
        """Gets system id to deploy cloned app materials to.

        *System Id* is a string, unique id for each system.
        This function returns the system id for a user's home system.

        :returns: System unique id
        :rtype: str
        """
        return NotImplemented

    @abstractmethod
    def get_application(self, *args, **kwargs):
        """Gets an application

        :param str appId: Unique id of the application

        :returns: Application instance
        :rtype: class Application
        """
        return NotImplemented

    @abstractmethod
    def check_app_for_updates(self, *args, **kwargs):
        """Checks cloned app for updates against host app by comparing the revision
        of the host app to the 'cloneRevision' tag inserted into the cloned apps tags.

        :param cloned_app: Application instance of the cloned application
        :param host_app_id: Agave id of the host application
        :host_app: Application instance of the host application

        :returns: update_required
        :rtype: bool
        """
        return NotImplemented

    @abstractmethod
    def clone_application(self, *args, **kwargs):
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
        return NotImplemented

    @abstractmethod
    def get_or_create_cloned_app(self, *args, **kwargs):
        """Gets or creates a cloned app for the user.

        Generates a cloned app id and tries to fetch that app.
        If the app exists, check for updates.

        If app does not exist, clone the host app to cloned app id.

        :param host_app: Application instance of host app
        :param str allocation: Project allocation for app to be run on

        :returns: Application instance
        :rtype: class Application
        """
        return NotImplemented

    @abstractmethod
    def get_or_create_app(self, *args, **kwargs):
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
        return NotImplemented

    @abstractmethod
    def clone_execution_system(self, *args, **kwargs):
        """Clone execution system for user.

        :param str host_system_id: Agave id of host execution system
        :param str new_system_id: id for system clone
        :param str alloc: Project allocation for system's custom directives

        :returns: ExecutionSystem instance
        :rtype: ExecutionSystem
        """
        return NotImplemented

    @abstractmethod
    def set_system_definition(self, *args, **kwargs):
        """Initializes Agave execution system

        :param class system: ExecutionSystem instance
        :param str allocation: Project allocation for customDirectives

        :returns: ExecutionSystem instance
        :rtype: class ExecutionSystem
        """
        return NotImplemented

    @abstractmethod
    def validate_exec_system(self, *args, **kwargs):
        """Validate execution system and generate keys for it

        :param system_id: Agave system id
        :param alloc: Project allocation for system

        :returns: ExecutionSystsem instance
        :rtype: class ExecutionSystem
        """
        return NotImplemented

    @abstractmethod
    def get_exec_system(self, *args, **kwargs):
        """Gets an execution system

        :param systemId: Agave Execution system id

        :returns: ExecutionSystem instance
        :rtype: class ExecutionSystem
        """
        return NotImplemented

    @abstractmethod
    def get_or_create_exec_system(self, *args, **kwargs):
        """Gets or creates user's execution system

        :param str clonedSystemId: Agave id of new system to be created
        :param str hostSystemId: Agave id of host system to clone from
        :param str alloc: Project allocation for system

        :returns: Agave response for the system
        """
        return NotImplemented
