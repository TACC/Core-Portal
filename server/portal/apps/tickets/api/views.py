import logging
import re
from functools import wraps
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.core.exceptions import PermissionDenied
from portal.apps.tickets import rtUtil
from portal.apps.tickets import utils
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from django.conf import settings

logger = logging.getLogger(__name__)

SERVICE_ACCOUNTS = ["portal", "rtprod", "rtdev"]
ALLOWED_HISTORY_TYPES = ["Correspond", "Create", "Status"]
METADATA_HEADER = "*** Ticket Metadata ***"


class TicketsView(BaseApiView):
    def get(self, request, ticket_id=None):
        """Get a list of all tickets for a user or a single ticket

        """
        if not request.user.is_authenticated:
            raise PermissionDenied

        rt = rtUtil.DjangoRt()
        if ticket_id:
            if not rt.hasAccess(ticket_id, request.user.email):
                raise PermissionDenied
            ticket = rt.getTicket(ticket_id)
            return JsonResponse({'tickets': [ticket]})
        else:
            user_tickets = rt.getUserTickets(request.user.email)
            return JsonResponse({'tickets': user_tickets})

    def post(self, request):
        """Post a new ticket

        """
        rt = rtUtil.DjangoRt()

        data = request.POST.copy()
        email = request.user.email if request.user.is_authenticated else data.get('email')
        subject = data.get('subject')
        problem_description = data.get('problem_description')
        cc = data.get('cc', '')

        attachments = [(f.name, ContentFile(f.read()), f.content_type) for f in request.FILES.getlist('attachments')]

        if subject is None or email is None or problem_description is None:
            return HttpResponseBadRequest()

        metadata = "{}\n\n".format(METADATA_HEADER)
        metadata += "Client info:\n{}\n\n".format(request.GET.get('info', "None"))

        for meta in ['HTTP_REFERER', 'HTTP_USER_AGENT', 'SERVER_NAME']:
            metadata += "{}:\n{}\n\n".format(meta, request.META.get(meta, "None"))

        if request.user.is_authenticated:
            metadata += "authenticated_user:\n{}\n\n".format(request.user.username)
            metadata += "authenticated_user_email:\n{}\n\n".format(request.user.email)
            metadata += "authenticated_user_first_name:\n{}\n\n".format(request.user.first_name)
            metadata += "authenticated_user_last_name:\n{}\n\n".format(request.user.last_name)
        else:
            metadata += "user_first_name:\n{}\n\n".format(data.get('first_name'))
            metadata += "user_last_name:\n{}\n\n".format(data.get('last_name'))

        problem_description += "\n\n" + metadata
        
        if not request.user.is_authenticated:
            recap_result = utils.get_recaptcha_verification(request)
            if recap_result['success']:
                ticket_id = rt.create_ticket(subject=subject,
                                         problem_description=problem_description,
                                         requestor=email,
                                         cc=cc,
                                         attachments=attachments)
                return JsonResponse({'ticket_id': ticket_id})
            if not recap_result['success']:
                raise ApiException('Invalid reCAPTCHA. Please try again.')

        ticket_id = rt.create_ticket(subject=subject,
                                    problem_description=problem_description,
                                    requestor=email,
                                    cc=cc,
                                    attachments=attachments)
        return JsonResponse({'ticket_id': ticket_id})

def has_access_to_ticket(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        request = args[1]
        ticket_id = kwargs.get("ticket_id")
        rt = rtUtil.DjangoRt()
        if rt.hasAccess(ticket_id, request.user.email):
            return function(*args, **kwargs)
        else:
            raise PermissionDenied

    return wrapper


@method_decorator(login_required, name='dispatch')
class TicketsHistoryView(BaseApiView):

    def _get_ticket_history(self, rt, requesting_username, ticket_id):
        """ Get ticket history

        Returns history of ticket. Complete RT history is not returned rather a subset of history types
        (see `ALLOWED_HISTORY_TYPES`).

        :param rt: rt util
        :param requesting_username: username of requester for determining if IsCreator
        :param requesting_username: username of requester for determining if IsCreator
        :return: return ticket history
        """
        ticket_history = rt.getTicketHistory(ticket_id)
        ticket_history = list(filter(lambda h: h['Type'] in ALLOWED_HISTORY_TYPES, ticket_history))
        for entry in ticket_history:
            if entry['Type'] == "Status":
                entry['Content'] = entry['Description']

            # Determine who created this message using portal
            if entry['Creator'] in SERVICE_ACCOUNTS:
                # Check if its a reply submitted on behalf of a user
                submitted_for_user = re.search(r'\[Reply submitted on behalf of (.*?)\]',
                                               entry['Content'].splitlines()[-1]) if entry['Content'] else False
                if submitted_for_user:
                    entry['Creator'] = submitted_for_user.group(1)
                    entry["Content"] = entry['Content'][:entry['Content'].rfind('\n')]

                # if user info is in the ticket metadata
                if not submitted_for_user and entry['Type'] == "Create":
                    submitted_for_user = re.findall(r'authenticated_user:[\r\n]+([^\r\n]+)',
                                                    entry['Content'], re.MULTILINE) if entry['Content'] else False
                    if submitted_for_user:
                        entry['Creator'] = submitted_for_user[-1]

            if entry['Type'] == "Create":
                entry["Content"] = entry['Content'][:entry['Content'].rfind(METADATA_HEADER)]

            entry["IsCreator"] = True if requesting_username == entry['Creator'] else False

            known_user = get_user_model().objects.filter(username=entry['Creator']).first()
            if known_user:
                entry['Creator'] = "{} {}".format(known_user.first_name, known_user.last_name)
        return ticket_history

    def _get_matching_history_entry(self, ticket_history, content):
        """ Find most-recent ticket history entry that matches certain content
        """
        for entry in reversed(ticket_history):
            if entry["IsCreator"] and entry["Content"] == content:
                return entry
        return None

    @has_access_to_ticket
    def post(self, request, ticket_id):
        """ Post reply to ticket

        """
        data = request.POST.copy()
        reply = data.get('reply')
        if reply is None:
            return HttpResponseBadRequest()

        # Add information on which user submitted this reply (as this is being done by a service account)
        modified_reply = reply + "\n[Reply submitted on behalf of {}]".format(request.user.username)

        attachments = [(f.name, ContentFile(f.read()), f.content_type) for f in request.FILES.getlist('attachments')]

        rt = rtUtil.DjangoRt()
        result = rt.replyToTicket(ticket_id=ticket_id, reply_text=modified_reply, files=attachments)
        if not result:
            raise ApiException("Unable to reply to ticket.")

        # RT doesn't return our reply so we need to request the history and pick out which entry
        # is ours.
        ticket_history = self._get_ticket_history(rt, request.user.username, ticket_id)
        history_reply = self._get_matching_history_entry(ticket_history, content=reply)
        if not history_reply:
            raise ApiException("Unable to reply to ticket.")

        return JsonResponse({'ticket_history_reply': history_reply})

    @has_access_to_ticket
    def get(self, request, ticket_id):
        """Get ticket history
        """
        rt = rtUtil.DjangoRt()
        ticket_history = self._get_ticket_history(rt, request.user.username, ticket_id)
        return JsonResponse({'ticket_history': ticket_history})
