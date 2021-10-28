import logging
import rt
import urllib
from django.views.generic.base import TemplateView
from django.shortcuts import render, redirect
from django.contrib import messages
from django.conf import settings
from django.http import HttpResponseRedirect
from pytas.http import TASClient
from portal.apps.request_access import forms
# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name



class IndexView(TemplateView):
    """
    Main workbench view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def dispatch(self, request, *args, **kwargs):

        if request.user.is_authenticated:
            return redirect('/workbench/dashboard/')

        return super(IndexView, self).dispatch(request, *args, **kwargs)
