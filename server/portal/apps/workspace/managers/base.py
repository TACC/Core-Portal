"""
.. module: apps.data_depot.managers.base
   :synopsis: Abstract classes to build Data Depot file managers.
"""
from __future__ import unicode_literals, absolute_import
import logging
#import datetime
#import os
from abc import ABCMeta, abstractmethod, abstractproperty
from six import add_metaclass
#from future.utils import python_2_unicode_compatible
#from cached_property import cached_property
#from django.conf import settings
#from django.contrib.auth import get_user_model
#from requests.exceptions import HTTPError

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@add_metaclass(ABCMeta)
class AbstractWorkspaceManager:
    """Abstract class describing a Manager describing the basic functionality for
    various resources needed to manage apps, e.g. Jobs, Monitors, Metadata, etc...

    .. rubric:: Rationale

    The *Workspace** should be the one place to go when a user needs to execute an
    application within the portal. These applications might live in different
    places and might be executed in different ways. These managers attempt to
    standardize this by creating a small abstraction layer.
    """

    def __init__(self, request, **kwargs):#pylint: disable=unused-argument
        """Inspect the request object to initialize manager.

        :param request: Django request object.
        """
        try:
            self._ac = request.user.agave_oauth.client
            self.username = request.user.username
        except AttributeError:
            self._ac = None
            self.username = 'AnonymousUser'

    @abstractproperty
    def requires_auth(self):
        """Check if we should check for auth"""
        return True

    @abstractmethod
    def get(self, *args, **kwargs):
        """Get single object instance"""
        return NotImplemented

    @abstractmethod
    def list(self, *args, **kargs):
        """Get list of objects"""
        return NotImplemented
