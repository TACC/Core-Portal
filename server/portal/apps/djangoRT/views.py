from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from portal.apps.djangoRT import rtUtil, forms, rtModels
from django.contrib.auth.decorators import login_required

@login_required
def mytickets(request):
	rt = rtUtil.DjangoRt()
	open_tickets = rt.getUserTickets(request.user.email, status="OPEN")
	new_tickets = rt.getUserTickets(request.user.email, status="NEW")
	response_tickets = rt.getUserTickets(request.user.email, status="RESPONSE REQUIRED")

	resolved_tickets = []
	resolved_tickets = rt.getUserTickets(request.user.email, status="RESOLVED")
	resolved_tickets.extend(rt.getUserTickets(request.user.email, status="CLOSED"))
	return render(request, 'ticketList.html', { 'open_tickets' : open_tickets, 'new_tickets' : new_tickets, 'response_tickets' : response_tickets, 'resolved_tickets' : resolved_tickets })

@login_required
def ticketdetail(request, ticketId):
	rt = rtUtil.DjangoRt()


	ticket = rt.getTicket(ticketId)
	ticket_history = rt.getTicketHistory(ticketId)
	return render(request, 'ticketDetail.html', { 'ticket' : ticket, 'ticket_history' : ticket_history, 'ticket_id' : ticketId, 'hasAccess' : rt.hasAccess(ticketId, request.user.email) })

def ticketcreate(request):
	rt = rtUtil.DjangoRt()

	data = {}
	if request.user.is_authenticated():
		data = { 'email' : request.user.email, 'first_name' : request.user.first_name, 'last_name' : request.user.last_name}

	if request.method == 'POST':
		form = forms.TicketForm(request.POST)

		if form.is_valid():
			ticket = rtModels.Ticket(subject = form.cleaned_data['subject'],
					problem_description = form.cleaned_data['problem_description'],
					requestor = form.cleaned_data['email'],
					cc = form.cleaned_data['cc'])
			ticket_id = rt.createTicket(ticket)

			if ticket_id > -1:
				return HttpResponseRedirect( reverse( 'tickets:detail', args=[ ticket_id ] ) )
			else:
				# make this cleaner probably
				data['subject'] = ticket.subject
				data['problem_description'] = ticket.problem_description
				data['cc'] = ticket.cc
				form = forms.TicketForm(data)
	else:
		form = forms.TicketForm()

	context = {
		'ticket_create' : form
	}

	return render(request, 'ticketCreate.html', context)

@login_required
def ticketreply(request, ticketId):
	rt = rtUtil.DjangoRt()

	ticket = rt.getTicket(ticketId)

	if request.method == 'POST':
		form = forms.ReplyForm(request.POST)

		if form.is_valid():
			if rt.replyToTicket(ticketId, form.cleaned_data['reply']):
				return HttpResponseRedirect(reverse( 'tickets:detail', args=[ ticketId ] ) )
			else:
				data['reply'] = form.cleaned_data['reply']
				form = forms.ReplyForm(data)

	else:
		form = forms.ReplyForm()
	return render(request, 'ticketReply.html', { 'ticket_id' : ticketId , 'ticket' : ticket, 'form' : form, 'hasAccess' : rt.hasAccess(ticketId, request.user.email) })
