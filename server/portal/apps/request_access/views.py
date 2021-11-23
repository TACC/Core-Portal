import logging
from django.views.generic.base import TemplateView
from django.shortcuts import redirect


class IndexView(TemplateView):
    """
    Request Access view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def dispatch(self, request, *args, **kwargs):

        if request.user.is_authenticated:
            return redirect('/workbench/dashboard/')

        return super(IndexView, self).dispatch(request, *args, **kwargs)
