from django.conf import settings
import json
import requests

class DjangoRecaptcha:
    def getRecaptchaVerification(self,request):
        recaptcha_response = request.POST.get('recaptchaResponse')
        secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY')
        data = {
            'secret': secret_key,
            'response': recaptcha_response
        }
        r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
        recap_result = r.json()
        return recap_result