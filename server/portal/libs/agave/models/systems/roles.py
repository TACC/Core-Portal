"""Roles.

.. :module:: portal.libs.agave.models.systems.roles
   :synopsis: Classes representing system's roles.
"""
import logging
from portal.libs.agave.exceptions import CreationError

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class Role(object):
    """A single role."""

    USER = 'USER'
    PUBLISHER = 'PUBLISHER'
    ADMIN = 'ADMIN'
    OWNER = 'OWNER'
    GUEST = 'GUEST'
    ALL_ROLES = [
        USER,
        PUBLISHER,
        ADMIN,
        OWNER,
        GUEST
    ]

    def __init__(self, role):
        """Init."""
        self.username = role.get('username')
        self.role = role.get('role')

    @property
    def value(self):
        """Role value."""
        return self.role

    def to_dict(self):
        """Representation of a role."""
        return {
            'username': self.username,
            'role': self.role
        }

    def __str__(self):
        """Str -> self.username: self.role."""
        return '{username}: {role}'.format(
            username=self.username,
            role=self.role
        )

    def __repr__(self):
        """Repr -> Role(self.username, self.role)."""
        return 'Role({username}, {role})'.format(
            username=self.username,
            role=self.role
        )


class Roles(object):
    """Roles."""

    def __init__(self, client, roles, parent):
        """Class to manage roles.

        :param client: Agave client.
        :param list roles: List of roles a returned by
            agave's role endpoint.
        :param parent: Parent agave object.
        """
        self._ac = client
        self.roles = [
            Role(role) for role in roles
        ]
        self._updated_roles = []
        self._parent = parent

    @property
    def to_update(self):
        """Public property for roles marked as updated."""
        return self._updated_roles

    def to_dict(self):
        """Dict representation of Roles."""

        roles= {}
        for role in self.roles:
            roles[role.username] = role.role

        return roles

    def _mark_as_updated(self, role):
        """Mark role object as updated.

        :param role: :class:`Role` object.
        """
        roles = [role_o for role_o in self._updated_roles
                 if role_o.username != role.username]
        roles.append(role)
        self._updated_roles = roles

    def for_user(self, username):
        """Return :class:`Role` for username.

        :param str username: Username.
        """
        res = [role for role in self.roles
               if role.username == username]
        if res:
            return res[0]

        return None

    def delete_for_user(self, username):
        """Delete role for user.

        :param str username: Username.
        """
        roles = [role_o for role_o in self.roles
                 if role_o.username == username]
        if roles:
            _role = roles[0]
            _role.role = 'NONE'
            self._mark_as_updated(_role)
        return self

    def add(self, username, role):
        """Add role for user.

        :param str username: Username.
        :param str role: Role
        """
        if role not in Role.ALL_ROLES:
            raise CreationError("Role is not valid")

        roles = [role_o for role_o in self.roles
                 if role_o.username == username]

        if roles:
            _role = roles[0]
            _role.role = role
            self._mark_as_updated(_role)
        else:
            _role = Role({
                'username': username,
                'role': role
            })
            self.roles.append(_role)
            self._mark_as_updated(_role)
        return self

    def save(self):
        """Save."""
        for role in self.to_update:
            res = self._ac.systems.updateRole(
                systemId=self._parent.id,
                body={
                    'role': role.role,
                    'username': role.username
                }
            )
            logger.debug('updating role: %s', res)

        # We are using cached_property and this is the way to
        # invalidate the cache.
        del self._parent.__dict__['roles']
        return self
