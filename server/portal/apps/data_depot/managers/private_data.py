"""
.. module: portal.apps.data_depot.managers.private_data
   :synopsis: Manager handling MyData from Agave Storage Systems.
"""
from __future__ import unicode_literals, absolute_import
import logging
from future.utils import python_2_unicode_compatible
from portal.apps.data_depot.managers.base import AgaveFileManager

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
        try:
            client = kwargs.get('client',
                                request.user.agave_oauth.client)
            self.session_id = kwargs.get('session_id',
                                         request.session.session_key)
            self.username = kwargs.get('username', request.user.username)
        except AttributeError:
            raise
            #community_user = settings.AGAVE_COMMUNITY_ACCOUNT
            #self._ac = get_user_model().\
            #           objects.get(username=community_user)
        super(FileManager, self).__init__(client, **kwargs)
