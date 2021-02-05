from django.views.generic.base import TemplateView

class IndexView(TemplateView):
    """
    Main workbench view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def dispatch(self, request, *args, **kwargs):
        return super(IndexView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['setup_complete'] = self.request.user.profile.setup_complete
        return context
