import logging
import re
from functools import wraps
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.core.exceptions import PermissionDenied
from portal.apps.djangoRT import rtUtil
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException

logger = logging.getLogger(__name__)

ALLOWED_HISTORY_TYPES = ["Correspond", "Create", "Status"]


@method_decorator(login_required, name='dispatch')
class TicketsView(BaseApiView):
    def get(self, request):
        """GET

        Returns a list of all tickets for a user.

        """
        rt = rtUtil.DjangoRt()
        user_tickets = rt.getUserTickets(request.user.email)

        return JsonResponse({'tickets': user_tickets})


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

            if entry['Creator'] == "portal":
                # Check if submitted on behalf of a user
                submitted_for_user = re.search(r'\[Reply submitted on behalf of (.*?)\]',
                                               entry['Content'].splitlines()[-1]) if entry['Content'] else False
                if submitted_for_user:
                    entry['Creator'] = submitted_for_user.group(1)
                    entry["Content"] = entry['Content'][:entry['Content'].rfind('\n')]

            entry["IsCreator"] = True if requesting_username == entry['Creator'] else False

            known_user = get_user_model().objects.filter(username=entry['Creator']).first()
            if known_user:
                entry['Creator'] = "{} {}".format(known_user.first_name, known_user.last_name)
        return ticket_history

    def _get_matching_history_entry(self, ticket_history, content):
        for entry in reversed(ticket_history):
            if entry["IsCreator"] and entry["Content"] == content:
                return entry
        return None

    @has_access_to_ticket
    def post(self, request, ticket_id):
        data = request.POST.copy()
        reply = data.get('reply')
        if reply is None:
            return HttpResponseBadRequest()

        # Add information on which user submitted this reply (as this is being done by `portal`)
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
        """GET
        """
        rt = rtUtil.DjangoRt()
        ticket_history = self._get_ticket_history(rt, request.user.username, ticket_id)
        return JsonResponse({'ticket_history': ticket_history})
