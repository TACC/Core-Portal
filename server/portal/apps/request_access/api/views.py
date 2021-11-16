from django.views.decorators.csrf import ensure_csrf_cookie
import logging
from django.http import JsonResponse, HttpResponseBadRequest
from django.conf import settings
from portal.apps.tickets import rtUtil
from portal.apps.tickets import utils
from portal.views.base import BaseApiView
from pytas.http import TASClient

logger = logging.getLogger(__name__)

METADATA_HEADER = "*** Ticket Metadata ***"

class RequestAccessView(BaseApiView):
    def post(self, request):
        """Post an access request

        """
        rt = rtUtil.DjangoRt()

        data = request.POST.copy()
        username = data.get('username')
        password = data.get('password')
        problem_description = data.get('problem_description')
        subject = 'Request Access'

        tas = TASClient(
                    baseURL=settings.TAS_URL,
                    credentials={
                        'username': settings.TAS_CLIENT_KEY,
                        'password': settings.TAS_CLIENT_SECRET
                    }
                )
        try:
            auth = tas.authenticate(username, password)
            user = tas.get_user(username=username)
            email = user['email']
            firstName = user['firstName']
            lastName = user['lastName']
        except Exception as e:
            return JsonResponse({'message': 'Incorrect Username or Password'}, status=401)

        if email is None or problem_description is None:
            return HttpResponseBadRequest()

        return utils.create_ticket(request,
                                   METADATA_HEADER,
                                   firstName = firstName,
                                   lastName = lastName,
                                   email = email,
                                   subject=subject)
