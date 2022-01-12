from django.views.generic.base import TemplateView
from django.conf import settings


class IndexView(TemplateView):
    """
    Main workbench view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['setup_complete'] = False if self.request.user.is_anonymous \
            else self.request.user.profile.setup_complete
        context['DEBUG'] = settings.DEBUG
        return context

    def dispatch(self, request, *args, **kwargs):
        return super(IndexView, self).dispatch(request, *args, **kwargs)
