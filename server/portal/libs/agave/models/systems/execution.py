"""
.. module: portal.libs.agave.models.systems.execution
   :synopsis: Models representing systems in Agave.
"""
import logging
from portal.libs.agave.exceptions import ValidationError
from portal.libs.agave.models.systems.base import BaseSystem

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


# pylint: disable=too-many-instance-attributes
class ExecutionSystem(BaseSystem):
    """Agave Storage System representation

    .. note::
        Schema: https://agavepy.readthedocs.io/en/latest/agavepy.systems.html
    """
    _body_fields = [
        'uuid',
        'id',
        'owner',
        'type',
        'name',
        'site',
        'available',
        'description',
        'environment',
        'execution_type',
        'max_system_jobs',
        'max_system_jobs_per_user',
        'scheduler',
        'scratch_dir',
        'startup_script',
        'status',
        'login',
        'queues',
        'storage',
        'work_dir',
        'revision',
        'default',
        'public',
        'global_default',
        'last_modified'
    ]

    # pylint: disable=redefined-builtin
    def __init__(self, client, id, **kwargs):
        kwargs['type'] = BaseSystem.TYPES.EXECUTION
        super(ExecutionSystem, self).__init__(
            client,
            id=id,
            **kwargs
        )
        self.uuid = getattr(self, 'uuid', None)
        self.id = id  # pylint: disable=invalid-name
        self.owner = getattr(self, 'owner', None)
        self.type = getattr(self, 'type', BaseSystem.TYPES.EXECUTION)
        self.name = getattr(self, 'name', None)
        self.site = getattr(self, 'site', None)
        self.available = getattr(self, 'available', True)
        self.description = getattr(self, 'description', '')
        self.environment = getattr(self, 'environment', None)
        self.execution_type = getattr(
            self,
            'execution_type',
            BaseSystem.EXECUTION_TYPES.HPC
        )
        self.max_system_jobs = getattr(self, 'max_system_jobs', 999)
        self.max_system_jobs_per_user = getattr(
            self,
            'max_system_jobs_per_user',
            10
        )
        self.scheduler = getattr(
            self,
            'scheduler',
            BaseSystem.SCHEDULERS.SLURM
        )
        self.scratch_dir = getattr(self, 'scratch_dir', None)
        self.startup_script = getattr(self, 'startup_script', None)
        self.status = getattr(self, 'status', 'UP')
        self.storage = getattr(self, 'storage', None)
        self.work_dir = getattr(self, 'work_dir', None)
        self._links = getattr(self, '_links', {})
        self.revision = getattr(self, 'revision', None)
        self.default = getattr(self, 'default', False)
        self.public = getattr(self, 'public', False)
        self.global_default = getattr(self, 'global_default', False)
        self.last_modified = getattr(self, 'last_modified', None)
        self.storage = getattr(self, 'storage', None)
        self.login = getattr(self, 'login', None)
        self.queues = getattr(self, 'queues', None)

    def validate_type(self):
        """Validate self.type"""
        if self.type != BaseSystem.TYPES.EXECUTION:
            raise ValidationError(
                "Execution system type must be {storage_type}".format(
                    storage_type=BaseSystem.TYPES.EXECUTION
                )
            )

    def validate_owner(self):
        """Validate self.owner"""
        pass

    def validate_available(self):
        """validate self.available"""
        if not isinstance(self.available, bool):
            raise ValidationError(
                "'available' should be of type 'bool'"
            )

    def validate_description(self):
        """Validate self.description"""
        pass

    def validate_uuid(self):
        """Validate self.uuid"""
        pass

    def validate_revision(self):
        """Validate self.revision"""
        pass

    def validate_site(self):
        """Validate self.site"""
        pass

    def validate_default(self):
        """Validate self.default"""
        if not isinstance(self.default, bool):
            raise ValidationError(
                "'default' should be of type 'bool'"
            )

    def validate_public(self):
        """Validate self.public"""
        if not isinstance(self.public, bool):
            raise ValidationError(
                "'public' should be of type 'bool'"
            )

    def validate_global_default(self):
        """Validate self.default"""
        if not isinstance(self.global_default, bool):
            raise ValidationError(
                "'global_default' should be of type 'bool'"
            )

    def validate_name(self):
        """Validat self.name"""
        if not self.name:
            raise ValidationError(
                "'name' should not be empty"
            )

    def validate_id(self):
        """Validate self.id"""
        if not self.id:
            raise ValidationError(
                "'id' should not be empty"
            )

    def validate_status(self):
        """Validate self.status"""
        statuses = ['UP', 'DOWN', 'UNKNOWN']
        if self.status not in statuses:
            raise ValidationError(
                "'status' should be one of: {statuses}".format(
                    statuses=statuses
                )
            )
