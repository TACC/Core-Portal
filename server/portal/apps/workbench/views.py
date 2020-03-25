"""
Accounts views.
"""
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required   #, permission_required  # Used in mailing_list_subscription.
from django.utils.decorators import method_decorator

@method_decorator(login_required, name='dispatch')
class IndexView(TemplateView):
    """
    Main accounts view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def dispatch(self, request, *args, **kwargs):
        return super(IndexView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        return context
