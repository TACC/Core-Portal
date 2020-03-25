"""
Public Data views.
"""
from django.utils.decorators import method_decorator
from django.views.generic.base import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie

@method_decorator(ensure_csrf_cookie, name='get')
class IndexView(TemplateView):
    """
    Main public data view.
    """
    template_name = 'portal/apps/public_data/index.html'
