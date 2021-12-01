from portal.apps.tickets import rtUtil
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.files.base import ContentFile

METADATA_HEADER = "*** Ticket Metadata ***"


def create_ticket(username, first_name, last_name, email, cc, subject,
                  problem_description, attachments, info, meta):
    rt = rtUtil.DjangoRt()

    if subject is None or email is None or problem_description is None:
        return HttpResponseBadRequest()

    metadata = "{}\n\n".format(METADATA_HEADER)
    metadata += "Client info:\n{}\n\n".format(info)

    for meta in ['HTTP_REFERER', 'HTTP_USER_AGENT', 'SERVER_NAME']:
        metadata += "{}:\n{}\n\n".format(meta, meta)

    if username:
        metadata += "authenticated_user:\n{}\n\n".format(username)
        metadata += "authenticated_user_email:\n{}\n\n".format(email)
        metadata += "authenticated_user_first_name:\n{}\n\n".format(first_name)
        metadata += "authenticated_user_last_name:\n{}\n\n".format(last_name)
    else:
        metadata += "user_first_name:\n{}\n\n".format(first_name)
        metadata += "user_last_name:\n{}\n\n".format(last_name)

    problem_description += "\n\n" + metadata

    ticket_id = rt.create_ticket(subject=subject,
                                 problem_description=problem_description,
                                 requestor=email,
                                 cc=cc,
                                 attachments=attachments)

    return JsonResponse({'ticket_id': ticket_id})
