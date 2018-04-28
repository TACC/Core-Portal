"""
.. module: portal.libs.agave.models.systems.base
   :synopsis: Models representing systems in Agave.
"""
from __future__ import unicode_literals, absolute_import
from collections import namedtuple
import logging
from future.utils import python_2_unicode_compatible
import requests
from requests.exceptions import HTTPError
from django.conf import settings
from portal.libs.agave.exceptions import ValidationError
from portal.libs.agave.models.base import BaseAgaveResource

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


@python_2_unicode_compatible
class BaseSystem(BaseAgaveResource):
    """Agave System representation

    .. note::
        Schema: https://agavepy.readthedocs.io/en/latest/agavepy.systems.html
    .. todo::
        This class should create a better API
    """

    EXECUTION_TYPES = namedtuple(
        'ExecutionTypes',
        ['HPC', 'CONDOR', 'CLI']
    )(
        HPC='HPC',
        CONDOR='CONDOR',
        CLI='CLI'
    )
    TYPES = namedtuple(
        'SystemTypes',
        ['STORAGE', 'EXECUTION']
    )(
        STORAGE='STORAGE',
        EXECUTION='EXECUTION'
    )
    AUTH_TYPES = namedtuple(
        'AuthTypes',
        ['SSHKEYS', 'PASSWORD']
    )(
        SSHKEYS='SSHKEYS',
        PASSWORD='PASSWORD'
    )
    LOGIN_PROTOCLS = namedtuple(
        'LoginProtocols',
        ['SSH', 'GSISSH', 'LOCAL']
    )(
        SSH='SSH',
        GSISSH='GSISSH',
        LOCAL='LOCAL'
    )
    STORAGE_PROTOCLS = namedtuple(
        'StorageProtocols',
        ['FTP',
         'GRIDFTP',
         'IRODS',
         'IRODS4',
         'LOCAL',
         'S3',
         'SFTP']
    )(
        FTP='FTP',
        GRIDFTP='GRIDFTP',
        IRODS='IRODS',
        IRODS4='IRODS4',
        LOCAL='LOCAL',
        S3='S3',
        SFTP='SFTP'
    )

    # pylint: disable=redefined-builtin
    def __init__(self, client, **kwargs):
        wrapped = {}
        sys_id = kwargs.get('id')
        if sys_id is not None:
            try:
                wrapped = client.systems.get(
                    systemId=sys_id
                )
            except HTTPError as exc:
                if exc.response.status_code != 404:
                    raise
        wrapped.update(**kwargs)
        storage = wrapped.pop('storage', {})
        login = wrapped.pop('login', {})
        super(BaseSystem, self).__init__(
            client,
            **wrapped
        )
        self.storage = BaseSystemStorage(**storage)
        if wrapped['type'] == self.TYPES.EXECUTION:
            self.login = BaseSystemLogin(**login)
    # pylint: enable=redefined-builtin

    @classmethod
    def create(cls, client, body):
        """Create a system

        :param dict body: System definition
        """
        resp = client.add(body=body)
        return cls(client, **resp)

    @classmethod
    def list(
            cls,
            client,
            type=None,  # pylint: disable=redefined-builtin
            default=None,
            limit=100,
            offset=0,
            public=None
    ):  # pylint: disable=too-many-arguments
        """List systems belonging to a specific user

        :param str type: Type of systems. One of :attr:`BaseSystem.TYPES`
        :param client: Agave client to use
        :param bool default: Only default systems
        :param bool public: Only public systems
        :param int limit: Page limit
        :param int offset: Page offset

        :return: Generator with systems
        :rtype: generator
        """
        systems = client.system.list(
            type=type,
            default=default,
            limit=limit,
            offset=offset,
            public=public
        )
        for system in systems:
            yield cls(client, **system)

    @classmethod
    def search(cls, client, query):
        """Search systems

        This is using the Agave `systems.search` directly.
        The query is a dictionary where each key is a Mongo-like search query
        using the value of the key.

        :Example:

            >>> systems = BaseSystem.search(
            ...     client,
            ...     {
            ...         'type.eq': BaseSystem.TYPES.STORAGE,
            ...         'id.like': 'cep.project.*'
            ...     }
            ... )
            >>> print systems
            ... [{'type': 'STORAGE', 'id': 'cep.project.123123-123-012'}, ...]

        :param client: Agave client to use
        :param dict queyr: Query to use

        :return list: A list of system objects

        .. seealso:: `systems-search --help`
        """
        if client.token:
            token = client.token.token_info['access_token']
        else:
            token = client._token  # pylint: disable=protected-access

        headers = {'Authorization': 'Bearer {token}'.format(token=token)}
        resp = requests.get(
            '{baseurl}/systems/v2'.format(
                baseurl=settings.AGAVE_TENANT_BASEURL),
            headers=headers,
            params=query
        )
        resp.raise_for_status()
        systems = resp.json()['response']
        return systems

    def _populate_obj(self):
        """Overriding

        Everything gets easier if we always populate system objects.
        """
        pass

    def update(self):
        """Updates a system"""
        self.validate()
        self._ac.systems.update(
            systemId=self.id,
            body=self.to_dict()
        )

    def set_login_keys(self, username, priv_key, pub_key):
        """Set SSH keys for login in a system"""
        self.login.auth.username = username
        self.login.auth.private_key = priv_key
        self.login.auth.public_key = pub_key
        self.update()
        return self

    def set_storage_keys(self, username, priv_key, pub_key):
        """Set SSH keys for storage login in a system"""
        self.storage.auth.username = username
        self.storage.auth.private_key = priv_key
        self.stroage.auth.public_key = pub_key
        self.update()
        self.storage.auth.private_key = ''
        return self

    def save(self):
        """Saves a new storage instance

        .. warning::
            If the system already exists a `ValueError` will be raised.
        """
        self.validate()
        try:
            res = self._ac.systems.get(
                systemId=self.id
            )
            if (res.status_code >= 200 and
                    res.status_code <= 299):
                raise ValueError(
                    'Agave System Id already exists'
                )
        except HTTPError as exc:
            if exc.response.status_code != 404:
                raise
        self.update()
        return self

    def update_role(self, username, role):
        """Update role for a system

        shortcut method for agavepy.systems.updateRole

        .. todo::
            There should be a better API to update permissions
        """
        self._ac.systems.updateRole(
            systemId=self.id,
            body={
                'role': role,
                'username': username
            }
        )


@python_2_unicode_compatible  # pylint: disable=too-few-public-methods
class BaseSystemProxy(BaseAgaveResource):
    """`proxy` nested object representation

        Class to represent the `proxy` nested object
        in a storage definition. This class is here
        to explicitly show how a system defines a storage.

    .. warning::
        This should only be used internally.
    """

    _body_fields = [
        'name',
        'host',
        'port'
    ]

    def __init__(self, **kwargs):
        super(BaseSystemProxy, self).__init__(
            None,
            **kwargs
        )
        self.name = kwargs.get('name')
        self.host = kwargs.get('host')
        self.port = kwargs.get('port')

    def _populate_obj(self):
        """No need to populate this obj"""
        pass

    def to_dict(self):
        """To dict conversion"""
        if (not self.name and
                not self.host and
                not self.port):
            return None

        dict_obj = super(BaseSystemProxy, self).to_dict()
        return dict_obj


@python_2_unicode_compatible  # pylint: disable=too-few-public-methods
class BaseSystemAuth(BaseAgaveResource):
    """`auth` nested object representation

        Class to represent the `auth` nested object
        in a storage definition. This class is here
        to explicitly show how a system defines a storage.

    .. warning::
        This should only be used internally.
    """

    _body_fields = [
        'type',
        'username',
        'public_key',
        'private_key',
        'password'
    ]

    def __init__(self, **kwargs):
        super(BaseSystemAuth, self).__init__(
            None,
            **kwargs
        )
        self.type = kwargs.get('type')
        self.username = kwargs.get('username')
        self.public_key = kwargs.get('publicKey')
        self.private_key = kwargs.get('privateKey')
        self.password = kwargs.get('password')

    def _populate_obj(self):
        """No need to populate this obj"""
        pass

    def to_dict(self):
        """To dict conversion"""
        dict_obj = super(BaseSystemAuth, self).to_dict()
        if self.type == BaseSystem.AUTH_TYPES.SSHKEYS:
            dict_obj.pop('password', None)
        elif self.type == BaseSystem.AUTH_TYPES.PASSWORD:
            dict_obj.pop('publicKey', None)
            dict_obj.pop('privateKey', None)
        return dict_obj


# pylint: disable=too-few-public-methods
# pylint: disable=too-many-instance-attributes
@python_2_unicode_compatible
class BaseSystemStorage(BaseAgaveResource):
    """`storage` nested object represntation

        Class to represent the `storage` nested object
        in a storage definition. This class is here
        to explicitly show how a system defines a storage.

    .. warning::
        This should only be used internally.
    """

    _body_fields = [
        'proxy',
        'protocol',
        'mirror',
        'port',
        'public_apps_dir',
        'host',
        'root_dir',
        'home_dir',
        'auth'
    ]

    def __init__(self, **kwargs):
        auth = kwargs.pop('auth', {})
        proxy = kwargs.pop('proxy', {})
        super(BaseSystemStorage, self).__init__(
            None,
            **kwargs
        )
        self.auth = BaseSystemAuth(**auth)
        self.proxy = BaseSystemProxy(**proxy)
        self.protocol = kwargs.get('protocol')
        self.mirror = kwargs.get('mirror', False)
        self.port = kwargs.get('port')
        self.public_apps_dir = kwargs.get('publicAppsDir')
        self.host = kwargs.get('host')
        self.root_dir = kwargs.get('rootDir')
        self.home_dir = kwargs.get('homeDir')

    def _populate_obj(self):
        """No need to populate this obj"""
        pass

    def validate_protocol(self):
        """Validate self.protocol"""
        protocols = [
            BaseSystem.STORAGE_PROTOCLS.FTP,
            BaseSystem.STORAGE_PROTOCLS.GRIDFTP,
            BaseSystem.STORAGE_PROTOCLS.IRODS,
            BaseSystem.STORAGE_PROTOCLS.IRODS4,
            BaseSystem.STORAGE_PROTOCLS.LOCAL,
            BaseSystem.STORAGE_PROTOCLS.S3,
            BaseSystem.STORAGE_PROTOCLS.SFTP
        ]
        if self.protocol not in protocols:
            raise ValidationError(
                "'protocol' should be one of {protocols}".format(
                    protocols=protocols
                )
            )

    def validate_mirror(self):
        """Validate self.mirror"""
        if not isinstance(self.mirror, bool):
            raise ValidationError(
                "'mirror' should be 'bool'"
            )

    def validate_port(self):
        """Validate self.port"""
        if not self.port:
            raise ValidationError(
                "'port' should not be empty"
            )

    def validate_host(self):
        """Validate self.host"""
        if not self.host:
            raise ValidationError(
                "'host' should not be empty"
            )

    def validate_root_dir(self):
        """Validate self.root_dir"""
        if not self.root_dir:
            raise ValidationError(
                "'root_dir' should not be empty"
            )

    def validate_home_dir(self):
        """Validate self.home_dir"""
        if not self.home_dir:
            raise ValidationError(
                "'home_dir' should not be empty"
            )


@python_2_unicode_compatible  # pylint: disable=too-few-public-methods
class BaseSystemLogin(BaseAgaveResource):
    """`login` nested object representation

        Class to represent the `login` nested object
        in a storage definition. This class is here
        to explicitly show how a system defines a storage.

    .. warning::
        This should only be used internally.
    """

    _body_fields = [
        'proxy',
        'protocol',
        'port',
        'auth',
        'host'
    ]

    def __init__(self, **kwargs):
        auth = kwargs.pop('auth', {})
        proxy = kwargs.pop('proxy', {})
        super(BaseSystemLogin, self).__init__(
            None,
            **kwargs
        )
        self.auth = BaseSystemAuth(**auth)
        self.proxy = BaseSystemProxy(**proxy)
        self.protocol = kwargs.get('protocol')
        self.port = kwargs.get('port')
        self.host = kwargs.get('host')

    def _populate_obj(self):
        """No need to populate this obj"""
        pass

    def validate_protocol(self):
        """Validate self.protocol"""
        protocols = [
            BaseSystem.LOGIN_PROTOCLS.SSH,
            BaseSystem.LOGIN_PROTOCLS.GSISSH,
            BaseSystem.LOGIN_PROTOCLS.LOCAL
        ]
        if self.protocol not in protocols:
            raise ValidationError(
                "'protocol' should be one of: {protocols}".format(
                    protocols=protocols
                )
            )

    def validate_port(self):
        """Validate self.port"""
        if not self.port:
            raise ValidationError(
                "'port' should not be empty"
            )

    def validate_host(self):
        """Validate self.host"""
        if not self.host:
            raise ValidationError(
                "'host' should not be empty"
            )
