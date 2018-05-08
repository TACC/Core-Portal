import six
import json
import logging
import uuid
from django.conf import settings
from portal.apps.data_depot.models.metadata import BaseMetadataResource
from portal.apps.data_depot.models.metadata_pems import BaseMetadataPermissionResource
from portal.apps.data_depot.models.systems import BaseSystemResource
from portal.apps.data_depot.models import roles as system_roles
from portal import utils

logger = logging.getLogger(__name__)


class ProjectStorageSystem(object):

    def __init__(self, rootDir, name, host):
        self.rootDir = rootDir
        self.name = name
        self.host = host
        self.uuid = uuid.uuid4()

    def to_dict(self):
        system_dict = {
          "description": "",
          "storage": {
            "proxy": "null",
            "protocol": "SFTP",
            "mirror": "false",
            "port": 22,
            "auth": {
              "type": "PASSWORD",
              "username": "sd2eadm",
              "password": "qwerty"
            },
            "publicAppsDir": "/.public-apps",
            "host": self.host,
            "rootDir": self.rootDir,
            "homeDir": "/"
          },
          "type": "STORAGE",
          "site": "tacc.utexas.edu",
          "default": "false",
          "public": "false",
          "globalDefault": "false",
          "name": self.name,
          "id": "projects.{uuid}".format(str(self.uuid))
        }
        return system_dict



class Project(BaseMetadataResource):
    """
    A Project represents a data collection with associated metadata. The base object for
    a project is a metadata object of the name (type) `portal.project`. Associated
    with this metadata object through `associationIds` is a directory in the Agave Files
    API that contains all the data for the project. Additional metadata may also be
    associated to the project and to other Files objects within the Project collection.
    """

    NAME = 'portal.project'
    STORAGE_SYSTEM_ID = 'test-sd2e-projects'

    def __init__(self, agave_client, **kwargs):
        defaults = {
            'name': Project.NAME
        }
        defaults.update(kwargs)
        super(Project, self).__init__(agave_client, **defaults)

        # initialize properties cache attributes
        self._project_directory = None
        self._project_system = None

    @classmethod
    def fetch(cls, ac, uuid):
        result = ac.meta.getMetadata(uuid=uuid)
        return cls(ac, **result)

    @classmethod
    def list_projects(cls, agave_client, **kwargs):
        """
        Get a list of Projects
        :param agave_client: agavepy.Agave: Agave API client instance
        :return:
        """
        query = {
            'name': Project.NAME
        }
        records = agave_client.meta.listMetadata(q=json.dumps(query), privileged=False)
        return [cls(agave_client=agave_client, **dict(r, **kwargs)) for r in records]

    @classmethod
    def search(cls, q, agave_client):
        """
        Search projects
        """
        if isinstance(q, basestring):
            query = q
        else:
            query = json.dumps(q)
        records = agave_client.meta.listMetadata(q=query, privileged=False)
        return [cls(agave_client=agave_client, **r) for r in records]

    def team_members(self):
        permissions = BaseMetadataPermissionResource.list_permissions(
            self.uuid, self._agave)
        pi = self.pi

        co_pis = getattr(self, 'co_pis', [])
        logger.info(co_pis)
        # co_pis = [x.username for x in permissions if x.username in co_pis_list]

        team_members_list = [x.username for x in permissions if x.username not in co_pis + [pi]]
        return {'pi': pi,
                'coPis': co_pis,
                'teamMembers': team_members_list}

    @property
    def collaborators(self):
        permissions = BaseMetadataPermissionResource.list_permissions(
            self.uuid, self._agave)
        return [pem.username for pem in permissions]

    def add_collaborator(self, username):
        logger.info('Adding collaborator "{}" to project "{}"'.format(username, self.uuid))

        # Set permissions on the metadata record
        pem = BaseMetadataPermissionResource(self.uuid, self._agave)
        pem.username = username
        pem.read = True
        pem.write = True
        pem.save()

        # Set roles on project system
        self.project_system.add_role(username, system_roles.USER)

    def remove_collaborator(self, username):
        logger.info('Removing collaborator "{}" from project "{}"'.format(username, self.uuid))

        team_members = self.value.get('teamMembers', [])
        # logger.info(coPis)
        team_members = [uname for uname in team_members if uname != username]

        self.value['teamMembers'] = team_members

        # Set permissions on the metadata record
        pem = BaseMetadataPermissionResource(self.uuid, self._agave)
        pem.username = username
        pem.read = False
        pem.write = False
        pem.save()

        # Set roles on project system
        self.project_system.remove_role(username)

    def update(self, **kwargs):
        '''Updates metadata values.

        This function should be used when updating or adding
        values to the metadata objects.

        :param dict kwargs: key = value of attributes to add/update in the object.
        :returns: itself for chainability
        :rtype: :class:`Project`

        ..note::
            When updating PIs, CO-PIs, team members or collaborators.
            Remember to use :func:`add_collaborator` or :func:`remove_collaborator` respectively.
        '''
        logger.debug('updating project metadata: {"id": "%s", "updates": %s}', self.uuid, kwargs)
        for key, value in six.iteritems(kwargs):
            camel_key = utils.agave.to_camel_case(key)
            self.value[camel_key] = value

    @property
    def title(self):
        return self.value.get('title')

    @title.setter
    def title(self, value):
        self.value['title'] = value

    @property
    def description(self):
        return self.value.get('description')

    @description.setter
    def description(self, value):
        self.value['description'] = value

    @property
    def pi(self):
        return self.value.get('pi')

    @pi.setter
    def pi(self, value):
        self.value['pi'] = value

    @property
    def pi_name(self):
        return self.value.get('pi_name')

    @pi_name.setter
    def pi_name(self, value):
        self.value['pi_name'] = value

    @property
    def co_pis(self):
        return self.value.get('coPis', [])

    def add_co_pi(self, username):
        logger.info('Adding Co PI "{}" to project "{}"'.format(username, self.uuid))

        coPis = self.value.get('coPis', [])

        coPis.append(username)
        self.value['coPis'] = list(set(coPis))
        self.add_collaborator(username)

    def remove_co_pi(self, username):
        logger.info('Removing Co PI "{}" from project "{}"'.format(username, self.uuid))

        coPis = self.value.get('coPis', [])
        # logger.info(coPis)
        coPis = [uname for uname in coPis if uname != username]

        self.value['coPis'] = coPis
        # logger.info(self.value)
        # Set permissions on the metadata record
        self.remove_collaborator(username)


    @co_pis.setter
    def co_pis(self, value):
        # TODO is this assertion valuable?
        # assert self.pi not in value
        self.value['coPis'] = value

    @property
    def project_system(self):
        if self._project_system is None:
            self._project_system = BaseSystemResource.from_id(self._agave,
                                                              self.project_system_id)
        return self._project_system

    @property
    def project_system_id(self):
        return 'project-{}'.format(self.uuid)
