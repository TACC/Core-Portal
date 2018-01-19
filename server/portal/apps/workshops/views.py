import logging
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponseNotFound
from django.shortcuts import render, redirect
from portal.apps.workshops import forms
from portal.apps.workshops import models

logger = logging.getLogger(__name__)


def workshop_authentication(request, workshop_id):
    workshop = models.Workshop.objects.get(pk=workshop_id)
    if not workshop:
        return HttpResponseNotFound()
    context = {
        "title": workshop.title
    }
    if request.method == 'GET':
        form = forms.WorkshopAuthForm()
        context["form"] = form
        return render(request, 'portal/apps/workshops/auth.html', context)
    else:
        access_form = forms.WorkshopAuthForm(request.POST)
        context["form"] = access_form
        if access_form.is_valid():
            data = access_form.cleaned_data
            access_code = data["access_code"]
            if access_code != workshop.access_code:
                messages.warning(request, 'Invalid code')
                return render(request, 'portal/apps/workshops/auth.html', context)
            else:
                response = HttpResponseRedirect(reverse('workshops:workshop', kwargs={"workshop_id":workshop_id}))
                response.set_cookie('workshop_access_token_{}'.format(workshop_id), workshop.access_code)
                return response
        else:
            messages.warning(request,'Bad access code')
            return render(request, 'portal/apps/workshops/auth.html', context)

def workshop(request, workshop_id):
    workshop = models.Workshop.objects.get(pk=workshop_id)
    if not workshop:
        return HttpResponseNotFound()
    context = {
        "workshop": workshop
    }
    workshop_access_token = request.COOKIES.get('workshop_access_token_{}'.format(workshop_id))

    if (not workshop_access_token) or (workshop_access_token != workshop.access_code):
        return redirect('workshops:workshop_authentication', workshop_id=workshop_id)
    return render(request, 'portal/apps/workshops/{}.html'.format(workshop_id), context)
