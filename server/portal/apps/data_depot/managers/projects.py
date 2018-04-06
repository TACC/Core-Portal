"""
.. module: portal.apps.data_depot.managers.projects
   :synopsis: Manager handling projects from Agave Storage Systems.
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.conf import settings
from future.utils import python_2_unicode_compatible
from portal.apps.data_depot.managers.base import AgaveFileManager
from portal.libs.agave.models.systems import BaseSystem

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name

@python_2_unicode_compatible
class FileManager(AgaveFileManager):
    """File Manager handling private data from Agave.
    """
    def __init__(self, request=None, **kwargs):#pylint: disable=super-init-not-called
        """Initializing client data.

        The Agave client is initialized. The session key and username are
        also stored on the instance level for debugging.

        :param request: Django request object.
        """
        client = kwargs.get('client',
                            request.user.agave_oauth.client)
        self.session_id = kwargs.get('session_id',
                                     request.session.session_key)
        self.username = kwargs.get('username', request.user.username)
        super(FileManager, self).__init__(client, **kwargs)

    @property
    def requires_auth(self):
        """Weather it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return True

    def projects_systems(self):
        """Returns all systems representing projects"""
        systems = BaseSystem.search(
            self.client,
            {
                'type.eq': 'STORAGE',
                'id.like': '{prefix}.*'.format(
                    settings.PORTAL_DATA_DEPOT_PROJECT_SYSTEM_PREFIX)
            }
        )
        return systems
