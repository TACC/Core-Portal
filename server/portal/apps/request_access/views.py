import logging
import rt
import urllib
from django.views.generic.base import TemplateView
from django.shortcuts import render
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
        return super(IndexView, self).dispatch(request, *args, **kwargs)

    def request_access(request):
        """ Request Access """
        if request.user.is_authenticated():
            messages.info(request, 'You are already logged in!')
            return HttpResponseRedirect('index')

        if request.method == 'POST':
            access_form = forms.RequestAccessForm(request.POST)

            if access_form.is_valid():
                data = access_form.cleaned_data
                username = data['username']
                password = data['password']

                tas = TASClient(
                    baseURL=settings.TAS_URL,
                    credentials={
                        'username': settings.TAS_CLIENT_KEY,
                        'password': settings.TAS_CLIENT_SECRET
                    }
                )
                try:
                    auth = tas.authenticate(username, password)
                    if (username and password and auth):
                        user = tas.get_user(username=username)
                        tracker = rt.Rt(
                            settings.RT_HOST,
                            settings.RT_UN,
                            settings.RT_PW,
                            basic_auth=(
                                settings.RT_UN,
                                settings.RT_PW
                            )
                        )
                        if tracker.login():
                            tracker.create_ticket(
                                #Queue='Web & Mobile Apps',
                                Queue=settings.RT_QUEUE,
                                Subject='New User Access Request',
                                Text=('User {username} is requesting '
                                      'access to Portal.').format(
                                          username=username
                                      ),
                                Requestors=user['email'],
                                CF_resource=settings.RT_TAG
                            )
                            tracker.logout()
                            messages.success(
                                request,
                                "Your request has been submitted. "
                                "An admin will be in contact with you "
                                "as soon as possible.")
                except Exception as exc:  # pylint: disable=broad-except
                    logger.error(exc, exc_info=True)
                    messages.warning(
                        request,
                        "We were unable to fulfill your request. "
                        "Please try again and contact helpdesk if "
                        "the problem persists.")

            else:
                messages.warning(
                    request,
                    "We were unable to fulfill your request. "
                    "Please try again and contact helpdesk "
                    "if the problem persists.")

        else:
            access_form = forms.RequestAccessForm()

        context = {
            'access_form': access_form,
            'rt_qn': urllib.quote(settings.RT_QUEUE),
        }
        return render(request, 'portal/apps/accounts/request_access.html', context)
