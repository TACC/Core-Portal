"""
.. :module:: portal.apps.projects.tasks
   :synopsis: Tasks pertaining to projects
"""
from __future__ import unicode_literals, absolute_import
import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from portal.apps.projects.models import Project

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


@shared_task(
    bind=True,
    max_retry=3
)
def add_memeber_to_project(self, owner, prj_id, username, role):
    """Add user role to system.

    :param str owner: Username who claims to be the owner.
    :param str prj_id: Project Id.
    :param str username: Username.
    :param str role: Role, one of [GUEST, USER, ADMIN, OWNER].
    """
    logger.debug('task id: %s', self.request.id)
    user = get_user_model().objects.get(username=owner)
    prj = Project(
        user.agave_oauth.client,
        prj_id
    )
    user = get_user_model().objects.get(username=username)
    res = prj.add_member(user)
    return res


# pylint: disable=too-many-arguments
@shared_task(
    bind=True,
    max_retry=3
)
def add_pem_to_prj_meta(self, owner, prj_id, username, read, write):
    """Add user role to system.

    :param str owner: Username who claims to be the owner.
    :param str prj_id: Project Id.
    :param str username: Username.
    :param bool read: Read.
    :param bool write: Write.
    """
    logger.debug('task id: %s', self.request.id)
    user = get_user_model().objects.get(username=owner)
    prj = Project(
        user.agave_oauth.client,
        prj_id
    )
    prj.metadata.permissions.add(username, read=read, write=write)
    res = prj.metadata.permissions.save()
    return res


@shared_task(bind=True)
def project_add_member_on_success(self, *args, **kwargs):
    """On Success callback."""
    logger.debug('args: %s', args)
    logger.debug('kwargs: %s', kwargs)
    logger.debug('task id: %s', self.request.id)
    return True


@shared_task(bind=True)
def project_add_member_on_error(self, *args, **kwargs):
    """On Error callback."""
    logger.debug('args: %s', args)
    logger.debug('kwargs: %s', kwargs)
    logger.debug('task id: %s', self.request.id)
    return True
