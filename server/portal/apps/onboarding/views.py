from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from future.utils import python_2_unicode_compatible
from django.views.generic.base import TemplateView, View
from django.contrib.auth import logout, get_user_model
from django.core.urlresolvers import reverse
from django.http import (
    HttpResponseRedirect, 
    HttpResponse, 
    HttpResponseForbidden
)
from django.shortcuts import render

@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
class SetupStatusView(View):
    """User setup steps view
    """
    def get(self, request, username=None):
        """GET"""
        user = request.user

        if username is not None:
            # If there is a username URL parameter
            if request.user.username != username and not request.user.is_staff:
                # The user must be staff to view another user
                logout(request)
                return HttpResponseRedirect(reverse('portal_accounts:login'))

            user = get_user_model().objects.get(username=username)

        context = { 
            'first_name' : user.first_name,
            'last_name' : user.last_name,
            'email' : user.email,
            'username' : user.username
        }

        return render(request, 'portal/apps/onboarding/setup.html', context)

@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
@method_decorator(staff_member_required, name='dispatch')
class SetupAdminView(View):
    """User setup admin view
    """
    def get(self, request):

        return render(request, 'portal/apps/onboarding/admin.html')
