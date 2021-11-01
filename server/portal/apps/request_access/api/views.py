from django.views.decorators.csrf import ensure_csrf_cookie
import logging
from django.http import JsonResponse, HttpResponseBadRequest
from django.conf import settings
from portal.apps.tickets import rtUtil
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
        except Exception as e:
            return JsonResponse({'message': 'Incorrect Username or Password'}, status=401)

        user = tas.get_user(username=username)
        email = user['email']
        firstName = user['firstName']
        lastName = user['lastName']

        if email is None or problem_description is None:
            return HttpResponseBadRequest()

        metadata = "{}\n\n".format(METADATA_HEADER)
        metadata += "Client info:\n{}\n\n".format(request.GET.get('info', "None"))

        for meta in ['HTTP_REFERER', 'HTTP_USER_AGENT', 'SERVER_NAME']:
            metadata += "{}:\n{}\n\n".format(meta, request.META.get(meta, "None"))

        metadata += "authenticated_user:\n{}\n\n".format(username)
        metadata += "authenticated_user_email:\n{}\n\n".format(email)
        metadata += "authenticated_user_first_name:\n{}\n\n".format(firstName)
        metadata += "authenticated_user_last_name:\n{}\n\n".format(lastName)

        problem_description += "\n\n" + metadata

        ticket_id = rt.create_ticket(subject=subject,
                                     problem_description=problem_description,
                                     requestor=email,
                                     cc='',
                                     attachments='')

        return JsonResponse({'ticket_id': ticket_id})
