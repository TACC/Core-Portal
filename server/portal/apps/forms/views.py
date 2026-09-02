from django.conf import settings
from django.http import JsonResponse

from portal.views.base import BaseApiView


class FormsView(BaseApiView):
    def get(self, request):
        form_name = request.GET.get("form_name")
        form = settings.FORMS.get(form_name)

        return JsonResponse({"response": form})
