import rt
from django.conf import settings
from datetime import datetime
from requests.auth import HTTPBasicAuth


class DjangoRt:
    def __init__(self):
        self.rtHost = getattr(settings, 'RT_HOST')
        self.rtUn = getattr(settings, 'RT_UN')
        self.rtPw = getattr(settings, 'RT_PW')
        self.rtQueue = getattr(settings, 'RT_QUEUE', '')

        self.tracker = rt.Rt(self.rtHost, self.rtUn, self.rtPw, http_auth=HTTPBasicAuth(self.rtUn, self.rtPw))
        self.tracker.login()

    def getUserTickets(self, userEmail, status="ALL"):
        if not status == "ALL":
            ticket_list = self.tracker.search(Queue=rt.ALL_QUEUES, Requestors__exact=userEmail, Status__exact=status,
                                              order='-LastUpdated')
        else:
            ticket_list = self.tracker.search(Queue=rt.ALL_QUEUES, Requestors__exact=userEmail, order='-LastUpdated')

        for ticket in ticket_list:
            ticket['id'] = ticket['id'].replace('ticket/', '')
            ticket['LastUpdated'] = datetime.strptime(ticket['LastUpdated'], '%a %b %d %X %Y')

        return ticket_list

    def getTicket(self, ticket_id):
        ticket = self.tracker.get_ticket(ticket_id)

        ticket['id'] = ticket['id'].replace('ticket/', '')

        return ticket

    def getTicketHistory(self, ticket_id):
        ticketHistory = self.tracker.get_history(ticket_id)

        for ticket in ticketHistory:
            ticket['Created'] = datetime.strptime(ticket['Created'], '%Y-%m-%d %X')

        return ticketHistory

    def create_ticket(self, attachments, subject, problem_description, requestor, cc):
        return self.tracker.create_ticket(Queue=self.rtQueue,
                                          files=attachments,
                                          Subject=subject,
                                          Text=problem_description,
                                          Requestor=requestor,
                                          Cc=cc,
                                          CF_resource=settings.RT_TAG)

    def replyToTicket(self, ticket_id, reply_text, files=[]):
        return self.tracker.reply(ticket_id=ticket_id, text=reply_text, files=files)

    # Checks if the current user is a requestor or CC on the ticket
    # Also doesn't crap out if the user isn't logged in even though
    # we should be checking before calling this
    def hasAccess(self, ticket_id, user=None):
        if user and ticket_id:
            ticket = self.tracker.get_ticket(ticket_id)
            if DjangoRt.contains_user(ticket.get('Requestors', ''), user) or DjangoRt.contains_user(ticket.get('Cc', ''), user):
                return True

        return False

    def getAttachment(self, ticket_id, attachment_id):
        ticketAttachment = self.tracker.get_attachment(ticket_id, attachment_id)
        return ticketAttachment

    @staticmethod
    def contains_user(ticket_field_data, user):
        user_lower = user.lower()

        if isinstance(ticket_field_data, str):
            return user_lower in ticket_field_data.lower()
        elif isinstance(ticket_field_data, list):
            return user_lower in map(str.lower, ticket_field_data)
        return user_lower in ticket_field_data
