from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic.base import View
from django.contrib.auth import logout, get_user_model
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render


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
                return HttpResponseRedirect(reverse('portal_accounts:logout'))

            user = get_user_model().objects.get(username=username)

        context = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'username': user.username
        }
        print(context)
        return render(request, 'portal/apps/onboarding/setup.html', context)


@method_decorator(login_required, name='dispatch')
@method_decorator(staff_member_required, name='dispatch')
class SetupAdminView(View):
    """User setup admin view
    """

    def get(self, request):

        return render(request, 'portal/apps/onboarding/admin.html')
