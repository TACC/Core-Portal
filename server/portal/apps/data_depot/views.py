"""
.. :module:: apps.data_depot.views
   :synopsis: Views to handle Data Depot
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required
# Create your views here.

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@method_decorator(login_required, name='dispatch')
class DataDepotView(TemplateView):
    """Data Depot View"""
    template_name = 'portal/apps/data_depot/data_depot.html'

    @method_decorator(ensure_csrf_cookie)
    def dispatch(self, request, *args, **kwargs):
        """Overwrite dispatch to ensure csrf cookie"""
        return super(DataDepotView, self).dispatch(request, *args, **kwargs)
