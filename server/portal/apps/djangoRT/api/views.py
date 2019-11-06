import logging
from django.http import HttpResponseNotFound, JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from portal.apps.djangoRT import rtUtil
from portal.views.base import BaseApiView

logger = logging.getLogger(__name__)


@method_decorator(login_required, name='dispatch')
class TicketsView(BaseApiView):

    def get(self, request):
        """TODO
        """
        rt = rtUtil.DjangoRt()
        user_tickets = rt.getUserTickets(request.user.email)

        return JsonResponse(user_tickets, safe=False)