from django.views.generic.base import TemplateView
from django.shortcuts import redirect
from django.conf import settings


class IndexView(TemplateView):
    """
    Request Access view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def dispatch(self, request, *args, **kwargs):

        if request.user.is_authenticated:
            return redirect('/workbench/dashboard/')

        return super(IndexView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['DEBUG'] = settings.DEBUG
        return context
