"""
.. :module:: portal.apps.accounts.api.views.systems
   :synopsis: Account's systems views
"""
from __future__ import unicode_literals, absolute_import
import logging
from future.utils import python_2_unicode_compatible
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from portal.views.base import BaseApiView
from portal.apps.accounts.managers import accounts as AccountsManager

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
class SystemsListView(BaseApiView):
    """Systems View"""

    def get(self, request):
        """ GET """
        offset = request.GET.get('offset', 0)
        limit = request.GET.get('limit', 100)
        storage_systems = AccountsManager.storage_systems(
            request.user,
            offset=offset,
            limit=limit
        )
        exec_systems = AccountsManager.execution_systems(
            request.user,
            offset=offset,
            limit=limit
        )
        return JsonResponse(
            {
                'response': {
                    'storage_systems': storage_systems,
                    'execution_systems': exec_systems
                },
                'status': 200
            },
            encoder=AccountsManager.agave_system_serializer_cls
        )
