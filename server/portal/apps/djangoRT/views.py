import logging
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from portal.apps.djangoRT import rtUtil, forms, rtModels
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
import os


logger = logging.getLogger(__name__)


@login_required
def mytickets(request):
	rt = rtUtil.DjangoRt()
	open_tickets = rt.getUserTickets(request.user.email, status="OPEN")
	new_tickets = rt.getUserTickets(request.user.email, status="NEW")
	response_tickets = rt.getUserTickets(request.user.email, status="RESPONSE REQUIRED")

	resolved_tickets = []
	resolved_tickets = rt.getUserTickets(request.user.email, status="RESOLVED")
	resolved_tickets.extend(rt.getUserTickets(request.user.email, status="CLOSED"))
	return render(request, 'ticketList.html',
	              {'open_tickets': open_tickets, 'new_tickets': new_tickets, 'response_tickets': response_tickets,
	               'resolved_tickets': resolved_tickets})


@login_required
def ticketdetail(request, ticketId):
	rt = rtUtil.DjangoRt()
	ticket = rt.getTicket(ticketId)
	ticket_history = rt.getTicketHistory(ticketId)
	return render(request, 'ticketDetail.html',
	              {'ticket': ticket, 'ticket_history': ticket_history, 'ticket_id': ticketId,
	               'hasAccess': rt.hasAccess(ticketId, request.user.email)})


def ticketcreate(request):
	rt = rtUtil.DjangoRt()

	data = {}
	if request.user.is_authenticated:
		data = {'email': request.user.email, 'first_name': request.user.first_name, 'last_name': request.user.last_name}

	subject = request.GET.get('subject', None)
	if subject:
		data['subject'] = subject

	info = request.GET.get('info', "None")
	metadata = "*** Ticket Metadata ***" + os.linesep + os.linesep
	metadata = metadata + "Client info:" + os.linesep + info + os.linesep + os.linesep

	for meta in ['HTTP_REFERER', 'HTTP_USER_AGENT', 'SERVER_NAME']:
		metadata = metadata + meta + os.linesep + request.META.get(meta, "None") + os.linesep + os.linesep

	data['metadata'] = metadata

	if request.method == 'POST':
		form = forms.TicketForm(request.POST)
		file = request.FILES.get('attachments', None)

		if form.is_valid():

			attachments = []
			if file:
				attachments.append((file.name, ContentFile(file.read()), file.content_type))

			ticket = rtModels.Ticket(subject=form.cleaned_data['subject'],
			                         problem_description=form.cleaned_data['problem_description'] + \
			                                             os.linesep + os.linesep + form.cleaned_data['metadata'],
			                         requestor=form.cleaned_data['email'],
			                         cc=form.cleaned_data['cc'], attachments=attachments)
			ticket_id = rt.createTicket(ticket)

			if ticket_id and int(ticket_id) > -1:
				return HttpResponseRedirect(reverse('tickets:detail', args=[ticket_id]))
			else:
				# make this cleaner probably
				data['subject'] = ticket.subject
				data['problem_description'] = ticket.problem_description
				data['cc'] = ticket.cc
				form = forms.TicketForm(data)

	else:
		form = forms.TicketForm(initial=data)

	context = {
		'ticket_create': form
	}

	return render(request, 'ticketCreate.html', context)


@login_required
def ticketreply(request, ticketId):
	rt = rtUtil.DjangoRt()
	ticket = rt.getTicket(ticketId)

	if request.method == 'POST':
		form = forms.ReplyForm(request.POST)
		file = request.FILES.get('attachments', None)

		if form.is_valid():
			attachments = []
			if file:
				attachments.append((file.name, ContentFile(file.read()), file.content_type))

			if rt.replyToTicket(ticketId, form.cleaned_data['reply'], files=attachments):
				return HttpResponseRedirect(reverse('tickets:detail', args=[ticketId]))
			else:
				data['reply'] = form.cleaned_data['reply']
				form = forms.ReplyForm(data)

	else:
		form = forms.ReplyForm()
	return render(request, 'ticketReply.html', {'ticket_id': ticketId, 'ticket': ticket, 'form': form,
                                            'hasAccess': rt.hasAccess(ticketId, request.user.email)})
