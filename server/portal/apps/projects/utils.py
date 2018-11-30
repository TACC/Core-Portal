"""
.. :module:: portal.apps.projects.models.utils
   :synopsis: Utils for projects
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.conf import settings
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.files import BaseFile

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def root_folder():
    """Return file object of project's root directory

    This file object is handy when creating a new project.
    """
    return BaseFile(
        service_account(),
        system=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
        path='/'
    )


def project_id_to_system_id(project_id):
    """Return a system id from a project id.

    A *system id* is a string constructed from the value of
    `settings.PORTAL_PROJECTS_NAME_PREFIX` followed by a "." (dot)
    and then a project id.
    A *project id* should be in the form [A-Z]+-[0-9]+.
    The prefix consists of one or more letters which ensures uniqueness
    across projects. This is usually configured by the value of
    `settings._PORTAL_PROJECTS_ID_PREFIX`.
    The prefix is followed by a "-" (dash) and a consecutive number.
    The consecutive number is saved in the local database.

    :param str project_id: Project Id.
    """
    return '{prefix}.{prj_id}'.format(
        prefix=settings.PORTAL_PROJECTS_NAME_PREFIX,
        prj_id=project_id
    )
