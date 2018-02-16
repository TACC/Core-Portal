"""
Place local settings here
"""

import os
from portal.settings import settings_secret

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEBUG = True
SITE_ID = 1

# database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': settings_secret._DJANGO_DB_ENGINE,
        'NAME': settings_secret._DJANGO_DB_NAME,
        'USER': settings_secret._DJANGO_DB_USER,
        'PASSWORD': settings_secret._DJANGO_DB_PASSWORD,
        'HOST': settings_secret._DJANGO_DB_HOST,
        'PORT': settings_secret._DJANGO_DB_PORT
    }
}

STATIC_ROOT = os.path.join(BASE_DIR, '../static')
MEDIA_ROOT = os.path.join(BASE_DIR, '../media')
CMSPLUGIN_CASCADE_PLUGINS = ['cmsplugin_cascade.bootstrap3']
WS4REDIS_CONNECTION = {
    'host': 'redis',
}
WEBSOCKET_URL = '/ws/'
WSGI_APPLICATION = 'ws4redis.django_runserver.application'

# TAS Authentication.
TAS_URL = settings_secret._TAS_URL
TAS_CLIENT_KEY = settings_secret._TAS_CLIENT_KEY
TAS_CLIENT_SECRET = settings_secret._TAS_CLIENT_SECRET

# Redmine Tracker Authentication.
RT_URL = settings_secret._RT_URL
RT_UN = settings_secret._RT_UN
RT_PW = settings_secret._RT_PW

# Recaptcha Authentication.
RECAPTCHA_PUBLIC_KEY = settings_secret._RECAPTCHA_PUBLIC_KEY
RECAPTCHA_PRIVATE_KEY = settings_secret._RECAPTCHA_PRIVATE_KEY
RECAPTCHA_USE_SSL = settings_secret._RECAPTCHA_USE_SSL
