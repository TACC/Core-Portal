"""Base models for projects.

.. :module:: portal.apps.projects.models.base
   :synopsis: Base models for projects. These classes mainly define
    functionality surrounding portal projects. A project within a portal's
    context refers to a collaboration environment. Behind it there are three
    main resources: :class:`~portal.libs.agave.models.files.BaseFile`,
    :class:`~portal.libs.agave.models.systems.storage.StorageSystem` and
    :class:`~portal.libs.agave.models.metadata.Metadata`.
    These classes live here because a project makes sense inside the protal's
    context, if these classes were a direct representation of Agave resources
    then they should live in `portal.libs.agave.models`
"""
from __future__ import unicode_literals, absolute_import
import logging
import os
from future.utils import python_2_unicode_compatible
from django.db import models, transaction
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth import get_user_model
from portal.utils import encryption as EncryptionUtil
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.projects import utils as ProjectsUtils
from portal.apps.projects.models.metadata import ProjectMetadata
from portal.apps.projects.exceptions import NotAuthorizedError
from portal.apps.accounts.models import SSHKeys

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def set_storage_auth(storage):
    """Set up storage auth details."""
    if not settings.PORTAL_PROJECTS_PRIVATE_KEY:
        key = EncryptionUtil.create_private_key()
        priv_key = EncryptionUtil.export_key(
            key,
            'PEM'
        )
        pub_key = EncryptionUtil.export_key(
            EncryptionUtil.create_public_key(key),
            'OpenSSH'
        )
        storage.storage.auth.public_key = pub_key
        storage.storage.auth.private_key = priv_key

        try:
            SSHKeys.objects.save_keys(
                get_user_model().objects.get(
                    username=settings.PORTAL_ADMIN_USERNAME
                ),
                system_id=storage.id,
                priv_key=priv_key,
                pub_key=pub_key
            )
        except Exception as exc:  # pylint:disable=broad-except
            logger.error(
                'There was an error saving the ssh keys locally: %s',
                exc,
                exc_info=True
            )
    else:
        storage.storage.auth.private_key = (
            settings.PORTAL_PROJECTS_PRIVATE_KEY
        )
        storage.storage.auth.public_key = (
            settings.PORTAL_PROJECTS_PUBLIC_KEY
        )

    storage.storage.auth.username = settings.PORTAL_ADMIN_USERNAME
    storage.storage.auth.type = storage.AUTH_TYPES.SSHKEYS
    return storage


class Project(object):
    """Project class."""

    metadata_name = settings.PORTAL_PROJECTS_NAME_PREFIX

    def __init__(
            self,
            client,
            project_id,
            metadata=None,
            storage=None
    ):
        """Project Init.

        .. note:: When initializing a project we first retrieve the
            storage system to make sure the user has access to the project.
            This will indirectly use Agave's permissions model.
            If the user does not have access to the project then the storage
            system will not be valid.

        :param client: Agave client.
        :param str project_id: Project Id in the form PRJ-[0-9]+.
        :param metadata: Metadata Object.
        :param storage: Storage Object.
        """
        self.project_id = project_id
        self._metadata = None
        self._storage = None
        self._ac = client
        if storage is None:
            self._storage = self._get_storage()
        else:
            self._storage = storage
        if not self._storage.last_modified:
            logger.debug(self._storage.to_dict())
            raise Exception("Invalid storage system")
        if metadata is None:
            self._metadata = self._get_metadata()
        else:
            self._metadata = metadata

    @property
    def storage(self):
        """Return project storage."""
        return self._storage

    @property
    def metadata(self):
        """Return project storage."""
        return self._metadata

    @property
    def title(self):
        """Return project title."""
        return self._storage.description

    @property
    def absolute_path(self):
        """Return absolute path for this project."""
        if self.storage.storage.root_dir:
            return self.storage.storage.root_dir

        return os.path.join(
            settings.PORTAL_PROJECTS_ROOT_DIR,
            self.storage.name
        )

    def _get_metadata(self):
        """Get metadata record for project.

        This method will act as "get or create".
        There is a small chance a metadata record was not created for
        the specific project storage system. This might happen if the
        project was created using another API or created through another
        portal instance where the metadata database is not the same.

        .. warning:: We should investigate if we could have race conditions
        while creating a metadata record.
        """
        try:
            meta = ProjectMetadata.objects.get(project_id=self.project_id)
        except ObjectDoesNotExist:
            meta = self._create_metadata(self.title, self.project_id)

        return meta

    def _get_storage(self):
        """Get storage system for project."""
        storage = StorageSystem(
            self._ac,
            id=ProjectsUtils.project_id_to_system_id(self.project_id),
        )
        return storage

    @staticmethod
    def _create_storage(
            title,
            storage_id,
            project_id
    ):
        """Create storage for project.

        :param str title: Project title.
        :param str storage_id: Storage ID.
        :param str project_id: Project Id. Preferably in the form PRJ-[0-9]+.
            This value will also be used as the name.

        .. note:: This method will use the service account to create
            the storage system.
        """
        storage = StorageSystem(
            client=service_account(),
            id=storage_id,
            name=project_id,
            description=title,
            site=settings.PORTAL_DOMAIN
        )
        storage.storage.port = settings.PORTAL_PROJECTS_SYSTEM_PORT
        storage.storage.home_dir = '/'
        storage.storage.root_dir = os.path.join(
            settings.PORTAL_PROJECTS_ROOT_DIR,
            project_id
        )
        storage.storage.protocol = 'SFTP'
        storage.storage.host = settings.PORTAL_PROJECTS_ROOT_HOST
        set_storage_auth(storage)

        storage.validate()
        storage.save()
        return storage

    @staticmethod
    def _create_metadata(title, project_id, owner=None):
        """Crate metadata for project.

        :param str title: Project Title.
        :param str project_id: Project Id.
        :param owner: Django user set as owner, who can set the project's PI.
        """

        # Create a default metadata object
        defaults = {
            'title': title
        }

        # If owner is specified for metadata, insert it
        # into the parameters for the model
        if owner:
            defaults['owner'] = owner

        (meta, created) = ProjectMetadata.objects.get_or_create(
            project_id=project_id,
            defaults=defaults
        )
        return meta

    @staticmethod
    def _create_dir(project_id):
        """Create directory for project."""
        ProjectsUtils.create_project_dir(project_id)

    @staticmethod
    def _delete_dir(project_id):
        """Delete a project directory"""
        ProjectsUtils.delete_project_dir(project_id)

    @classmethod
    def create(
            cls,
            client,
            title,
            project_id,
            owner
    ):
        """Create a project.

        :param client: Agave client
        :param str title: Project title
        :param str project_id: Project ID. Preferable in the form PRJ-[0-9]+
        """
        cls._create_dir(project_id)

        try:
            storage = cls._create_storage(
                title,
                ProjectsUtils.project_id_to_system_id(project_id),
                project_id
            )

            meta = cls._create_metadata(
                title,
                project_id,
                owner
            )
        except Exception as e:
            cls._delete_dir(project_id)
            raise e

        return cls(client, project_id, metadata=meta, storage=storage)

    @classmethod
    def listing(
            cls,
            client,
            offset=0,
            limit=100
    ):
        """List projects for a username.

        .. note:: When listing projects we first list all the storage
            systems a user has access to. This is an indirect way to use
            Agave's permission model. Once we get the storage systems then
            we retrieve the metadata objects from the database that
            correspond to the project id defined in the storage system.

        :param client: Agave client.
        :param int offset: Offset.
        :param int limit: Limit.
        """
        systems = StorageSystem.search(
            client,
            query={'id.like': '{}*'.format(cls.metadata_name),
                   'type.eq': StorageSystem.TYPES.STORAGE},
            offset=offset,
            limit=limit
        )
        for system in systems:
            try:
                meta = ProjectMetadata.objects.get(project_id=system.name)
            except ObjectDoesNotExist:
                meta = {}
            prj = cls(
                client,
                system.name,
                metadata=meta,
                storage=system
            )
            prj.storage.absolute_path = prj.absolute_path
            yield prj

    def _can_edit_member(self, username):
        """Check if user can edit team members.

        :param str username: Username to check for pems.
        """
        role = self.storage.roles.for_user(username)
        if (role is not None and
                (role.role == role.ADMIN or
                 role.role == role.OWNER)):
            return True

        return False

    def add_pi(self, user):
        """Add PI to project.

        A project's PI will have an ``OWNER`` system role.
        :param user: Django user instance.
        """
        if not self._can_edit_member(self._ac.token.token_username):
            raise NotAuthorizedError(extra={'user': user})

        self.storage.roles.add(
            user.username,
            'OWNER'
        )
        self.storage.roles.save()
        self.metadata.pi = user
        self.save_metadata()
        return self

    def remove_pi(self, user):
        """Remove PI from project.

        :param user: Django user instance.
        """
        if not self._can_edit_member(self._ac.token.token_username):
            raise NotAuthorizedError(extra={'user': user})

        self.storage.roles.delete_for_user(user.username)
        self.storage.roles.save()
        self.metadata.pi = None
        self.save_metadata()
        return self

    def add_co_pi(self, user):
        """Add Co-PI to project.

        A project's Co-PI will have an ``ADMIN`` system role.
        :param user: Django user instance.
        """
        if not self._can_edit_member(self._ac.token.token_username):
            raise NotAuthorizedError(extra={'user': user})

        self.storage.roles.add(
            user.username,
            'ADMIN'
        )
        self.storage.roles.save()
        self.metadata.co_pis.add(user)
        self.save_metadata()
        return self

    def remove_co_pi(self, user):
        """Remove Co-PI from project.

        :param user: Django user instance.
        """
        if not self._can_edit_member(self._ac.token.token_username):
            raise NotAuthorizedError(extra={'user': user})

        self.storage.roles.delete_for_user(user.username)
        self.storage.roles.save()
        self.metadata.co_pis.remove(user)
        self.save_metadata()
        return self

    def add_member(self, user):
        """Add user to project.

        When we add a user to a project we have to:
            1. Add a role to the storage system.
            2. Add user to the metadata record.

        :param str user: Django user object.
        """
        if not self._can_edit_member(self._ac.token.token_username):
            raise NotAuthorizedError(extra={'user': user})

        self.storage.roles.add(
            user.username,
            'USER'
        )
        self.storage.roles.save()
        self.metadata.team_members.add(user)
        self.save_metadata()
        return self

    def remove_member(self, user):
        """Remove Co-PI from project.

        :param user: Django user instance.
        """
        if not self._can_edit_member(self._ac.token.token_username):
            raise NotAuthorizedError(extra={'user': user})

        self.storage.roles.delete_for_user(user.username)
        self.storage.roles.save()
        self.metadata.team_members.remove(user)
        self.save_metadata()
        return self

    def save_metadata(self):
        """Help method to save metadata object.

        If there's anything else we need to do before or
        after saving a project's metadata object it should be
        implemented here.
        """
        # Manually validate model: https://docs.djangoproject.com/en/1.10/ref/
        # models/instances/#django.db.models.Model.full_clean
        self.metadata.full_clean()
        self.metadata.save()
        return self

    def save_storage(self):
        """Help method to save storage object.

        If there's anything else we need to do before or
        after saving a project's storage object it should be
        implemented here.
        """
        set_storage_auth(self.storage)
        self.storage.update()

    def __repr__(self):
        """Repr."""
        return 'Project({project_id}, {metadata}, {storage})'.format(
            project_id=self.project_id,
            metadata=self.metadata,
            storage=self.storage
        )

    def __str__(self):
        """Str -> self.project_id."""
        return self.project_id


@python_2_unicode_compatible
class ProjectId(models.Model):
    """Project ID Model.

    This model will hold the consecutive number to assign
    project IDs.
    """

    value = models.IntegerField()
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    @transaction.atomic
    def update(cls, value):
        """Atomically updates value of next project id."""
        row = cls.objects.select_for_update().latest('last_updated')
        row.value = value
        row.save()
        return row.value

    @classmethod
    @transaction.atomic
    def next_id(cls):
        """Return next id."""
        row = cls.objects.select_for_update().latest('last_updated')
        row.value += 1
        row.save()
        return row.value

    def __str__(self):
        """Str -> self.value."""
        return str(self.value)
