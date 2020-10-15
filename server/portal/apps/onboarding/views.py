from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def onboarding(request):
    return render(request, 'portal/apps/workbench/index.html')
