"""Publication views.

.. :module:: apps.publications.views
   :synopsis: Views to handle Publications
"""
import json
import logging
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView
from portal.apps.projects.workspace_operations.shared_workspace_operations import create_publication_review_shared_workspace
from portal.apps.projects.models.metadata import ProjectsMetadata
from django.db import transaction
from portal.apps.projects.tasks import copy_files_and_metadata
from portal.apps.notifications.models import Notification
from django.http import HttpResponse


LOGGER = logging.getLogger(__name__)

class PublicationRequestView(BaseApiView):

    @method_decorator(login_required, name='dispatch')
    def post(self, request):
        
        data = json.loads(request.body)

        client = request.user.tapis_oauth.client
        
        source_workspace_id = data['projectId']
        review_workspace_id = f"{source_workspace_id}-REVIEW"
        source_system_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{source_workspace_id}'
        review_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{review_workspace_id}"

        with transaction.atomic():
            # Update authors for the source project 
            source_project = ProjectsMetadata.objects.get(project_id=source_system_id)
            source_project.metadata['authors'] = data['authors']
            source_project.save()

        system_id = create_publication_review_shared_workspace(client, source_workspace_id, source_system_id, review_workspace_id, 
                                                   review_system_id, data['title'], data['description'])


        # Start task to copy files and metadata
        copy_files_and_metadata.apply_async(kwargs={
            'user_access_token': client.access_token.access_token, 
            'source_workspace_id': source_workspace_id,
            'review_workspace_id': review_workspace_id,
            'source_system_id': source_system_id, 
            'review_system_id': review_system_id
        })

        # Create notification 
        event_data = {
                Notification.EVENT_TYPE: 'default',
                Notification.STATUS: Notification.INFO,
                Notification.USER: request.user.username,
                Notification.MESSAGE: f'{source_workspace_id} submitted for review',
            }
        
        with transaction.atomic():
                Notification.objects.create(**event_data)

        return HttpResponse('OK')