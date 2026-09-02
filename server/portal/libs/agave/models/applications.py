"""
.. :module:: portal.libs.agave.models.applications
   :synopsis: Classes to represent Agave Applications
"""
from collections import namedtuple
import logging
from cached_property import cached_property_with_ttl
from portal.libs.agave.exceptions import (
    ValidationError,
    CreationError,
    DeletionError,
    APIError
)
from portal.libs.agave.models.base import BaseAgaveResource
from portal.libs.agave.models.permissions import ApplicationPermissions

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


# pylint:disable=too-many-instance-attributes
class Application(BaseAgaveResource):
    """Agave application definition representation."""

    _body_fields = [
        'id',
        'name',
        'icon',
        'uuid',
        'parallelism',
        'default_processors_per_node',
        'default_memory_per_node',
        'default_node_count',
        'default_max_run_time',
        'default_queue',
        'version',
        'revision',
        'is_public',
        'help_uri',
        'label',
        'owner',
        'short_description',
        'long_description',
        'tags',
        'ontology',
        'execution_type',
        'execution_system',
        'deployment_path',
        'deployment_system',
        'template_path',
        'test_path',
        'checkpointable',
        'last_modified',
        'modules',
        'available',
        'inputs',
        'parameters',
        'outputs',
        '_links'
    ]

    _PARALLELISM = ['SERIAL', 'PARALLEL', 'PTHREAD']
    PARALLELISM = namedtuple(
        'Parallelism',
        _PARALLELISM
    )(
        SERIAL='SERIAL',
        PARALLEL='PARALLEL',
        PTHREAD='PTHREAD'
    )

    _EXECUTION_TYPE = ['ATMOSPHERE', 'HPC', 'CONDOR', 'CLI']
    EXECUTION_TYPE = namedtuple(
        'ExecutionType',
        _EXECUTION_TYPE
    )(
        ATMOSPHERE='ATMOSPHERE',
        HPC='HPC',
        CONDOR='CONDOR',
        CLI='CLI'
    )

    def __init__(self, client, id=None, load=True, ignore_error=404, **kwargs):
        """Agave application definition representation.
        """
        wrapped = {}
        if id is not None and load:
            # try:
            wrapped = client.apps.get(
                appId=id
            )
            # except HTTPError as exc:
            #     if exc.response.status_code != ignore_error:
            #         raise

        wrapped.update(**kwargs)

        super(Application, self).__init__(client, **wrapped)

        self.id = getattr(self, 'id', None)
        self.name = getattr(self, 'name', None)
        self.icon = getattr(self, 'icon', None)
        self.uuid = getattr(self, 'uuid', None)
        self.parallelism = getattr(self, 'parallelism', None)
        self.default_processors_per_node = getattr(self, 'default_processors_per_node', None)
        self.default_memory_per_node = getattr(self, 'default_memory_per_node', None)
        self.default_node_count = getattr(self, 'default_node_count', None)
        self.default_max_run_time = getattr(self, 'default_max_run_time', None)
        self.default_queue = getattr(self, 'default_queue', None)
        self.version = getattr(self, 'version', None)
        self.revision = getattr(self, 'revision', None)
        self.is_public = getattr(self, 'is_public', False)
        self.help_uri = getattr(self, 'help_uri', None)
        self.label = getattr(self, 'label', '')
        self.owner = getattr(self, 'owner', None)
        self.short_description = getattr(self, 'short_description', '')
        self.long_description = getattr(self, 'long_description', None)
        self.tags = getattr(self, 'tags', [])
        self.ontology = getattr(self, 'ontology', [])
        self.execution_type = getattr(self, 'execution_type', None)
        self.execution_system = getattr(self, 'execution_system', None)
        self.deployment_path = getattr(self, 'deployment_path', None)
        self.deployment_system = getattr(self, 'deployment_system', None)
        self.template_path = getattr(self, 'template_path', None)
        self.test_path = getattr(self, 'test_path', None)
        self.checkpointable = getattr(self, 'checkpointable', False)
        self.last_modified = getattr(self, 'last_modified', None)
        self.modules = getattr(self, 'modules', [])
        self.available = getattr(self, 'available', True)
        self.inputs = getattr(self, 'inputs', [])
        self.parameters = getattr(self, 'parameters', [])
        self.outputs = getattr(self, 'outputs', [])
        self._links = getattr(self, '_links', {})

        self.exec_sys = None

    @cached_property_with_ttl(ttl=60 * 15)
    def permissions(self):
        """Permissions"""

        if self.is_public:
            raise APIError(
                "Cannot list permissions on public apps."
                "\"is_public\" must be \"False\"."
            )

        pems = self._ac.apps.listPermissions(appId=self.id)
        return ApplicationPermissions(self._ac, pems, self)

    def __str__(self):
        return '{id}'.format(id=self.id)

    # def __repr__(self):
    #     return '{class_name}(id={id}, label={label})'.format(
    #         class_name=self.__class__.str(__name__),
    #         id=self.id,
    #         label=self.label
    #     )

    def _populate_obj(self):
        """Populate Object.

        Object should always be populated when instantiated.
        """
        pass

    def validate_available(self):
        """Validate self.available"""
        if not isinstance(self.available, bool):
            raise ValidationError(
                "'available' should be of type 'bool'"
            )

    def validate_inputs(self):
        """Validate self.inputs"""
        if self.inputs is None:
            raise ValidationError(
                "'inputs' should not be None"
            )

    def validate_execution_system(self):
        """Validate self.execution_system"""
        if not self.execution_system:
            raise ValidationError(
                "'execution_system' should not be None"
            )

    def validate_test_path(self):
        """Validate self.test_path"""
        if not self.test_path:
            raise ValidationError(
                "'test_path' should not be empty"
            )

    def validate_deployment_path(self):
        """Validate self.deployment_path"""
        if not self.deployment_path:
            raise ValidationError(
                "'deployment_path' should not be empty"
            )

    def validate_template_path(self):
        """Validate self.version"""
        if not self.template_path:
            raise ValidationError(
                "'template_path' should not be empty"
            )

    def validate_deployment_system(self):
        """Validate self.deployment_system"""
        if not self.deployment_system:
            raise ValidationError(
                "'deployment_system' should not be empty"
            )

    def validate_name(self):
        """Validate self.name"""
        if not self.name:
            raise ValidationError(
                "'name' should not be empty"
            )

    def validate_parameters(self):
        """Validate self.parameters"""
        if self.parameters is None:
            raise ValidationError(
                "'parameters' should not be None"
            )

    def validate_execution_type(self):
        """Validate self.execution_type"""
        types = self._EXECUTION_TYPE
        if self.execution_type not in types:
            raise ValidationError(
                "'execution_type' should be one of: {types}".format(
                    types=types
                )
            )

    def validate_version(self):
        """Validate self.version"""
        if not self.version:
            raise ValidationError(
                "'version' should not be empty"
            )

    def validate_checkpointable(self):
        """Validate self.checkpointable"""
        if not isinstance(self.checkpointable, bool):
            raise ValidationError(
                "'checkpointable' should be of type 'bool'"
            )

    def validate_label(self):
        """Validate self.label"""
        if self.label is None:
            raise ValidationError(
                "'label' should not be None"
            )

    def validate_parallelism(self):
        """Validate self.parallelism"""
        types = self._PARALLELISM
        if self.parallelism not in types:
            raise ValidationError(
                "'parallelism' should be one of: {types}".format(
                    types=types
                )
            )

    def validate_short_description(self):
        """Validate self.short_description"""
        if self.short_description is None:
            raise ValidationError(
                "'short_description' should not be None"
            )

    @staticmethod
    def remove(client, id):
        """Removes an application record.

        :param client: Agave client.
        :param str id: Application id.
        """
        return client.apps.delete(appId=id)

    @classmethod
    def create(cls, client, app_def):
        """Creates an application.

        :param client: Agave client.
        :param dict app_def: `dict` representing application definition.
        """
        if app_def.get('id') is not None:
            raise CreationError(
                "Cannot specify \"id\" if creating application."
                "\"id\" must be \"None\"."
            )
        resp = client.apps.add(body=app_def)
        return cls(client, **resp)

    @classmethod
    def from_dict(cls, client, dict_obj):
        """Initialize Application from dictionary.

        :param client: Agave client
        :param dict dict_obj: Dictionary object
        """
        return cls(client, load=False, **dict_obj)

    def delete(self):
        """Delete this application record.

        .. note:: This method differs from :meth:`remove` in that it will
            remove the application record this class represents. :meth:`remove`
            is a static method meant to be used when it is not necessary to
            instantiate an application record to delete it, i.e. when we can get
            the application id easily.
        """
        if self.id is None:
            raise DeletionError(
                "Must specify \"id\" to delete application record"
            )
        res = self._ac.apps.delete(
            appId=self.id
        )
        return res

    def update(self):
        """Update an application record."""
        self.validate()
        self._ac.apps.update(
            appId=self.id,
            body=self.to_dict()
        )

    def save(self):
        """Save this app record.

        .. note:: This is to be used when instantiating the app from the class, e.g. from_dict,
            and the app does not already exist.
        """
        self.validate()
        self._ac.apps.add(
            body=self.to_dict()
        )

    def clone(self, client, depl_path=None, exec_sys=None, depl_sys=None, name=None, ver=None):
        """Clone this application record
        """

        self.validate()
        if self.last_modified is None:
            raise CreationError(
                "Host app must already exist to be cloned."
                "\"last_modified\" must not be \"None\"."
            )

        body = {
            'action': 'clone',
            'deploymentPath': depl_path,
            'executionSystem': exec_sys,
            'deploymentSystem': depl_sys,
            'name': name,
            'version': ver
        }

        resp = client.apps.manage(appId=self.id, body=body)

        return Application(client, **resp)

    def publish(self, client):
        """Publish this app
        """

        self.validate()
        if self.is_public:
            raise CreationError(
                "Cannot publish public apps."
                "\"is_public\" must be \"False\"."
            )

        body = {
            'action': 'publish'
        }

        resp = client.apps.manage(appId=self.id, body=body)

        return Application(client, **resp)
