"""
.. :module:: portal.libs.agave.models.permissions
   :synopsis: Classes representing Agave permissions for different resources.
"""
import logging
from portal.libs.agave.exceptions import CreationError

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class Permission(object):
    """A single permission"""
    READ = 'READ'
    READ_WRITE = 'READ_WRITE'
    READ_EXECUTE = 'READ_EXECUTE'
    WRITE = 'WRITE'
    WRITE_EXECUTE = 'WRITE_EXECUTE'
    EXECUTE = 'EXECUTE'
    ALL = 'ALL'
    NONE = 'NONE'

    def __init__(self, permission):
        self.username = permission.get('username')
        self.recursive = permission.get('recursive', False)
        _pem = permission.get('permission')
        self.read = _pem.get('read', False)
        self.write = _pem.get('write', False)
        self.execute = _pem.get('execute', False)

    @property
    def value(self):
        """Permission's value.

        This is the string value which should be one of the constants in this
        class. e.g. READ, READ_WRITE, etc...
        """
        pem = ''
        if self.read:
            pem += 'READ'
        if self.write:
            pem += '_WRITE'
        if self.execute:
            pem += '_EXECUTE'
        pem = pem.strip('_')
        if pem == 'READ_WRITE_EXECUTE':
            pem = 'ALL'
        elif not pem:
            pem = 'NONE'
        return pem

    def to_dict(self):
        """Dict representation"""
        return {
            'username': self.username,
            'recursive': self.recursive,
            'permission': self.value
        }

    def __str__(self):
        """String -> self.username [R,W,E]"""
        return '{username} {recursive}[{read}, {write}, {execute}]'.format(
            username=self.username,
            recursive=self.recursive,
            read=self.read,
            write=self.write,
            execute=self.execute
        )

    def __repr__(self):
        """Repr -> Permissions(username, R, W, E)"""
        return (
            'Permissions('
            '{username},'
            'recursive={recursive},'
            'read={read},'
            'write={write},'
            'execute={execute})'
        ).format(
            username=self.username,
            recursive=self.recursive,
            read=self.read,
            write=self.write,
            execute=self.execute
        )

    def __eq__(self, other):
        """Equality"""
        return (
            self.username == other.username and
            self.recursive == other.recursive and
            self.read == other.read and
            self.write == other.write and
            self.execute == other.execute
        )


class Permissions(object):
    """Permissions"""

    def __init__(self, client, permissions):
        """Class to manage permissions.

        :param client: Agave client
        :param list permissions: List of permissions as returned by
            agave's pems endpoint.
        """
        self._ac = client
        self.permissions = [
            Permission(permission) for permission in permissions
        ]
        self._updated_pems = []

    @property
    def to_update(self):
        """Public property for pems marked as updated"""
        return self._updated_pems

    def _mark_as_updated(self, pem):
        """Mark permission object as updated.

        :param pem: :class:`Permission` object
        """
        pems = [pem_o for pem_o in self._updated_pems
                if pem_o.username != pem.username]
        pems.append(pem)
        self._updated_pems = pems

    def for_user(self, username):
        """Returns :class:`Permission` for username

        :param str username: Username.
        """
        res = [pem for pem in self.permissions
               if pem.username == username]
        if res:
            return res[0]
        # If the user doesn't have a permission in the list, it means the user
        # has no permission at all.
        return Permission({
            'username': username,
            'recursive': False,
            'permission': {
                'read': False,
                'write': False,
                'execute': False
            }
        })

    def can_user(self, username, pem):
        """Check if user has permission.

        :param str username: Username
        :param str pem: Permission. One of ['read', 'write', 'execute']
        """
        permission = self.for_user(username)
        val = getattr(permission, pem.lower(), False)
        return val

    def add(
            self,
            username,
            recursive=True,
            read=False,
            write=False,
            execute=False
    ):  # pylint: disable=too-many-arguments
        """Add permission for user.

        :param str username: Username.
        :param bool read: Read pem.
        :param bool write: Write pem.
        :param bool execute: Execute pem.
        """
        if not read and not write and not execute:
            raise CreationError("User must set at least one permission.")
        pems = [pem for pem in self.permissions
                if pem.username == username]
        if pems:
            pem = pems[0]
            pem.recursive = recursive
            pem.read = read
            pem.write = write
            pem.execute = execute
            self._mark_as_updated(pem)
        else:
            pem = Permission({
                'username': username,
                'recursive': recursive,
                'permission': {
                    'read': read,
                    'write': write,
                    'execute': execute
                }
            })
            self.permissions.append(pem)
            self._mark_as_updated(pem)
        return self


class FilePermissions(Permissions):
    """File Permissions representation."""

    def __init__(self, client, permissions, parent):
        """Class to manage File permissions.

        :param client: Agave client
        :param list permissions: List of permissions as returned by
            agave's pems endpoint.
        :param parent: Agave File object.
        """
        super(FilePermissions, self).__init__(client, permissions)
        self.parent = parent

    def save(self):
        """Save."""
        for pem in self.to_update:
            res = self._ac.files.updatePermissions(
                filePath=self.parent.path,
                systemId=self.parent.system,
                body=pem.to_dict()
            )
            logger.debug('Saving file permissions response: %s', res)

        return self


class MetadataPermissions(Permissions):
    """Metadata Permissions representation."""

    def __init__(self, client, permissions, parent):
        """Class to manage Metadata permissions.

        :param client: Agave client
        :param list permissions: List of permissions as returned by
            agave's pems endpoint.
        :param parent: Agave Metadata object.
        """
        super(MetadataPermissions, self).__init__(client, permissions)
        self.parent = parent

    def save(self):
        """Save."""
        for pem in self.to_update:
            self._ac.meta.updateMetadataPermissions(
                uuid=self.parent.uuid,
                body=pem.to_dict()
            )

        # We are using cached_property and this is the way to
        # invalidate the cache.
        del self.parent.__dict__['permissions']
        return self


class ApplicationPermissions(Permissions):
    "Application Permissions representation"

    def __init__(self, client, permissions, parent):
        """Class to manage Application permissions.

        :param client: Agave client
        :param list permissions: List of permissions as returned by
            agave's pems endpoint.
        :param parent: Agave Application object.
        """
        super(ApplicationPermissions, self).__init__(client, permissions)
        self.parent = parent

    def save(self):
        """Save."""
        for pem in self.to_update:
            res = self._ac.apps.updateApplicationPermissions(
                appId=self.parent.id,
                body=pem.to_dict()
            )
            logger.debug('Saving applications permissions response: %s', res)

        return self
