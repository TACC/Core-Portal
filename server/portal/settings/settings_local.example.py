"""
Place local settings here
"""
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEBUG = True
SITE_ID = 1


# database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
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
