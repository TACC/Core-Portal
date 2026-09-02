from portal.apps.tickets import rtUtil
from django.http import JsonResponse, HttpResponseBadRequest
from django.conf import settings
import requests

METADATA_HEADER = "*** Ticket Metadata ***"


def create_ticket(username, first_name, last_name, email, cc, subject,
                  problem_description, attachments, info, meta):
    rt = rtUtil.DjangoRt()

    if subject is None or email is None or problem_description is None:
        return HttpResponseBadRequest()

    metadata = "{}\n\n".format(METADATA_HEADER)
    metadata += "Client info:\n{}\n\n".format(info)

    for key in ['HTTP_REFERER', 'HTTP_USER_AGENT', 'HTTP_HOST']:
        metadata += "{}:\n{}\n\n".format(key, meta.get(key, "None"))

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


def get_recaptcha_verification(request):
    recaptcha_response = request.POST.get('recaptchaResponse')
    secret_key = settings.RECAPTCHA_SECRET_KEY
    data = {
        'secret': secret_key,
        'response': recaptcha_response
    }
    r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
    recap_result = r.json()
    return recap_result
