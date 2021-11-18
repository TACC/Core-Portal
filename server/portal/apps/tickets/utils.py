from django.conf import settings
import requests


def get_recaptcha_verification(request):
    recaptcha_response = request.POST.get('recaptchaResponse')
    secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY')
    data = {
        'secret': secret_key,
        'response': recaptcha_response
    }
    r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
    recap_result = r.json()
    print(recap_result)
    return recap_result
