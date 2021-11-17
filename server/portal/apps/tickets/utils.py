from portal.apps.tickets import rtUtil
from django.http import JsonResponse, HttpResponseBadRequest

def create_ticket(request, METADATA_HEADER, **kargs):
    rt = rtUtil.DjangoRt()

    data = request.POST.copy()

    if kargs:
        firstName = kargs['firstName']
        lastName = kargs['lastName']
        email = kargs['email']
        subject = kargs['subject']
    else:
        firstName = data.get('first_name')
        lastName = data.get('last_name')
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
        metadata += "user_first_name:\n{}\n\n".format(firstName)
        metadata += "user_last_name:\n{}\n\n".format(lastName)

    problem_description += "\n\n" + metadata

    ticket_id = rt.create_ticket(subject=subject,
                                 problem_description=problem_description,
                                 requestor=email,
                                 cc=cc,
                                 attachments=attachments)

    return JsonResponse({'ticket_id': ticket_id})
