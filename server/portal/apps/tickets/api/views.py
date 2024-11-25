import logging
import re
from functools import wraps
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
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

        data = request.POST.copy()
        subject = data.get('subject')
        problem_description = data.get('problem_description')
        cc = data.get('cc', [''])
        attachments = [(f.name, ContentFile(f.read()), f.content_type)
                       for f in request.FILES.getlist('attachments')]
        info = request.GET.get('info', "None")
        meta = request.META
        is_authenticated = request.user.is_authenticated
        username = None
        if (is_authenticated):
            username = request.user.username
            email = request.user.email
            first_name = request.user.first_name
            last_name = request.user.last_name
        else:
            if settings.RECAPTCHA_SECRET_KEY:
                recap_result = utils.get_recaptcha_verification(request)
                if not recap_result.get('success', False):
                    raise ApiException('Invalid reCAPTCHA. Please try again.')
            email = data.get('email')
            first_name = data.get('first_name')
            last_name = data.get('last_name')

        return utils.create_ticket(username,
                                   first_name,
                                   last_name,
                                   email,
                                   cc,
                                   subject,
                                   problem_description,
                                   attachments,
                                   info,
                                   meta)


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


class TicketsAttachmentView(BaseApiView):
    @has_access_to_ticket
    def get(self, request, ticket_id, attachment_id):
        rt = rtUtil.DjangoRt()
        attachment = rt.getAttachment(ticket_id, attachment_id)
        content = attachment["Content"]
        content_type = attachment["ContentType"]
        response = HttpResponse(content, content_type=content_type)
        response["Content-Disposition"] = attachment["Headers"]["Content-Disposition"]
        return response
