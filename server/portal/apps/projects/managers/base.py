"""Base managers.

.. :module:: portal.apps.projects.managers.base
   :synopsis: Manager for projects
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.elasticsearch.docs.base import IndexedProject
from portal.apps.projects.models import Project, ProjectId, ProjectSystemSerializer
from portal.apps.projects.serializers import MetadataJSONSerializer
from portal.apps.projects.models.utils import get_latest_project_storage, get_latest_project_directory
from django.core.exceptions import ObjectDoesNotExist


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('{}.{}'.format('metrics', __name__))
# pylint: enable=invalid-name


class ProjectsManager(object):
    """Projects Manager."""

    systems_serializer_cls = ProjectSystemSerializer
    meta_serializer_cls = MetadataJSONSerializer

    def __init__(
            self,
            user,
            *args,
            **kwagrs
    ):  # pylint: disable=unused-argument
        """Projects Manager init.

        :param user: Django user instance.
        """
        self.user = user

    def _add_acls(self, username, project_id, project_root):
        """Run an agave job to set ACLs.

        :param str username: Username.
        :param str project_id: Project Id.
        """
        logger.info('Adding ACLs for %s in project %s', username, project_id)
        client = service_account()
        job = client.jobs.submit(body={
            "name": "{username}-{project_id}-acls".format(
                username=username,
                project_id=project_id
            ),
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": project_id,
                "username": username,
                "action": "add",
                "root_dir": project_root,
            }
        })
        logger.info('Add ACLs job id: %s', job.id)

    def _remove_acls(self, username, project_id, project_root):
        """Run an agave job to set ACLs.

        :param str username: Username.
        :param str project_id: Project Id.
        """
        logger.info('Removing ACLs for %s in project %s', username, project_id)
        client = service_account()
        job = client.jobs.submit(body={
            "name": "{username}-{project_id}-acls".format(
                username=username,
                project_id=project_id
            ),
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": project_id,
                "username": username,
                "action": "remove",
                "root_dir": project_root,
            }
        })
        logger.info('Remove ACLs job id: %s', job.id)

    def get_by_system_id(self, system_id):
        """Get a single project by system id.

        :param str system_id: System Id.
        """
        sys = StorageSystem(
            self.user.tapis_oauth.client,
            system_id
        )
        prj = Project(
            self.user.tapis_oauth.client,
            sys.name,
            storage=sys
        )
        return prj

    def get_by_project_id(self, project_id):
        """Get a single project.

        :param str project_id: Project Id.
        """
        prj = Project(
            self.user.tapis_oauth.client,
            project_id
        )
        if not prj.storage.uuid:
            raise Exception("No project.")
        return prj

    def get_project(self, project_id=None, system_id=None):
        """Get a single project.

        This method will retrieve a project by, either, system_id or
        project_id.

        :param str project_id: Project Id (optional).
        :param str system_id: System Id (optional).
        """
        if project_id:
            prj = self.get_by_project_id(project_id)
        elif system_id:
            prj = self.get_by_system_id(system_id)
        else:
            raise Exception("Must use project_id or system_id.")
        return prj

    def create(self, title):
        """Create a project.

        This method will figure out the next consecutive number to assign to
        the projectId and then call
        :meth:`portal.apps.projects.models.base.Project.create`.
        Meaning, it will create three objects:
        1. Directory based on `settings.PORTAL_PROJECTS_ROOT_DIR`
        2. Agave Metadata record with the project id and title.
        3. Agave storage system pointing to the directory created.

        :param str title: Project title
        """
        if not title:
            raise Exception("No title.")

        try:
            prjId = ProjectId.next_id()
        except ObjectDoesNotExist:
            latest_storage_system_id = get_latest_project_storage()
            latest_project_id = get_latest_project_directory()
            max_value_found = max(latest_storage_system_id, latest_project_id, 0)
            ProjectId.objects.create(value=max_value_found)
            prjId = ProjectId.next_id()

        project_id = '{prefix}-{prjId}'.format(
            prefix=settings.PORTAL_PROJECTS_ID_PREFIX,
            prjId=prjId
        )

        try:
            prj = Project.create(
                self.user.tapis_oauth.client,
                title,
                project_id,
                self.user
            )
        except ValueError:
            # Tapis StorageSystem or ProjectMetadata with this ProjectID already exists,
            # try to update to latest project value and recreate
            logger.info('Project with id: {} already exists'.format(project_id))

            latest_storage_system_id = get_latest_project_storage()
            latest_project_id = get_latest_project_directory()
            max_value_found = max(latest_storage_system_id, latest_project_id, 0)

            logger.info('Updating ProjectId to latest project dir or storage system id: {}'.format(max_value_found))

            ProjectId.update(max_value_found)
            project_id = '{prefix}-{prj_id}'.format(
                prefix=settings.PORTAL_PROJECTS_ID_PREFIX,
                prj_id=ProjectId.next_id()
            )
            prj = Project.create(
                self.user.tapis_oauth.client,
                title,
                project_id,
                self.user
            )

        prj.storage.update_role(
            self.user.username,
            'ADMIN'
        )
        METRICS.info('user:{} created project: id={}, title:{}'.format(self.user.username, project_id, title))

        return prj

    def list(self, offset=0, limit=100):
        """List projects."""
        return [prj.storage for prj in Project.listing(
            self.user.tapis_oauth.client,
            offset=offset,
            limit=limit
        )]

    def search(self, query_string, offset=0, limit=100):
        """Search projects by query string"""
        search_result = IndexedProject.search()
        search_result = search_result.query("query_string",
                                            query=query_string,
                                            minimum_should_match="80%")

        search_result = search_result.execute()
        result_ids = list(map(lambda hit: hit.projectId, search_result))

        project_list = self.list()
        filtered_list = filter(lambda prj: prj.name in result_ids,
                               project_list)

        return list(filtered_list)

    def apply_permissions(self, project, username, acl):
        """Index project and update acls
        """
        project_id = project.project_id
        project_root = project.storage.storage.root_dir
        if acl == 'add':
            self._add_acls(username, project_id, project_root)
        elif acl == 'remove':
            self._remove_acls(username, project_id, project_root)

    def transfer_ownership(self, project_id, old_owner, new_owner):
        """Transfer ownership by setting new PI
        and demoting old PI to Co-PI
        """
        old_pi = get_user_model().objects.get(username=old_owner)
        new_pi = get_user_model().objects.get(username=new_owner)
        prj = Project(
            service_account(),
            project_id
        )
        prj.transfer_pi(old_pi, new_pi)
        return prj

    def add_member(self, project_id, member_type, username):
        """Add member to a project.

        When adding a member to a project we are giving
        that user full access to everything within the project.

        :param str project_id: Project Id.
        :param str member_type: One of ['pi', 'co_pi', 'team_member']
        :param str username: Username.
        """
        user = get_user_model().objects.get(username=username)
        prj = self.get_project(project_id)
        if member_type == 'team_member':
            prj.add_member(user)
        elif member_type == 'co_pi':
            prj.add_co_pi(user)
        elif member_type == 'pi':
            prj.add_pi(user)
        else:
            raise Exception('Invalid member type.')
        self.apply_permissions(prj, username, 'add')
        return prj

    def remove_member(self, project_id, member_type, username):
        """Remove member from a project.

        :param str project_id: Project Id.
        :param str member_type: One of ['pi', 'co_pi', 'team_member']
        :param str username: Username.
        """
        user = get_user_model().objects.get(username=username)
        prj = self.get_project(project_id)
        if member_type == 'team_member':
            prj.remove_member(user)
        elif member_type == 'co_pi':
            prj.remove_co_pi(user)
        elif member_type == 'pi':
            prj.remove_pi(user)
        else:
            raise Exception('Invalid member type.')
        self.apply_permissions(prj, username, 'remove')
        return prj

    def change_system_role(self, project_id, username, new_role):
        user = get_user_model().objects.get(username=username)
        prj = self.get_project(project_id)
        prj.change_storage_system_role(user, new_role)
        return prj

    def change_project_role(self, project_id, username, old_role, new_role):
        user = get_user_model().objects.get(username=username)
        prj = self.get_project(project_id)
        prj.change_project_role(user, old_role, new_role)
        return prj

    def _update_meta(self, project, **data):  # pylint: disable=no-self-use
        """Update project metadata.

        :param project: Project object.
        :param dict data: Data to update.
        """
        meta = project.metadata
        logger.debug('data: %s', data)
        for field in data:
            try:
                # We have to check if the attribute is in the class
                # because setattr() will add an nonexistent attribute
                # and we want to raise an error if the update call is
                # trying to update a field that hasn't been defined by
                # the model.
                getattr(meta, field)
            except AttributeError:
                raise
            setattr(meta, field, data[field])
        project.save_metadata()
        return project

    def _update_storage(self, project, **data):  # pylint: disable=no-self-use
        """Update project storage.

        We access
        .. warning:: It is only allowed to update the title of
        a project's storage system.

        :param project: project instance.
        :param dict data: Data to update.
        """
        title = data.get('title')

        if title is not None:
            project.storage.description = title
        project.save_storage()
        return project

    def update_prj(self, project_id=None, system_id=None, **data):
        """Update project.

        ``data`` should be a dictionary where each key maps to
        a metadata field for a project.
        :class:`~portal.apps.projects.models.metadata.ProjectMetadata`.

        :param str project_id: Project Id.
        :param dict data: Dictionary where keys are project's field names.
        """
        data.pop('id', None)
        data.pop('project_id', None)
        # When accessing a project's metadata it's a good practice to
        # instantiate a Project class instead of using ProjectMetadata
        # directly. This way we use Agave's permission model indirectly.
        prj = self.get_project(project_id, system_id)
        self._update_meta(prj, **data)
        self._update_storage(prj, **data)
        return prj

    def role_for_user(self, project_id, username):
        """
        Get a user's role for a project.
        returns one of 'pi', 'co_pi', 'team_member', None
        """
        prj = self.get_project(project_id)

        return prj.get_project_role(username)
