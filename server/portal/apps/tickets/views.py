from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.conf import settings


@login_required
def tickets(request):
    response = redirect('/workbench/dashboard/')
    return response


@ensure_csrf_cookie
def ticket_create(request):
    if request.user.is_authenticated and request.user.profile.setup_complete:
        response = redirect('/workbench/dashboard/tickets/create/')
        return response
    return render(request, 'portal/apps/workbench/index.html',
                  context={'DEBUG': settings.DEBUG})
