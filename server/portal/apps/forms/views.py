from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden


class FormsView(BaseApiView):

    def get(self, request):
        form_name = request.GET.get('form_name')
        form = settings.FORMS.get(form_name)

        return JsonResponse(form)
