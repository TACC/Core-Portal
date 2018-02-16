"""
Celery config
"""

import os
from kombu import Exchange, Queue
from portal.settings import settings_secret

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#BROKER_URL = 'amqp://designsafe:pwd@rabbitmq:5672//'
_BROKER_URL_PROTOCOL = 'amqp://'
_BROKER_URL_USERNAME = settings_secret._BROKER_URL_USERNAME
_BROKER_URL_PWD = settings_secret._BROKER_URL_PWD
_BROKER_URL_HOST = settings_secret._BROKER_URL_HOST
_BROKER_URL_PORT = settings_secret._BROKER_URL_PORT
_BROKER_URL_VHOST = settings_secret._BROKER_URL_VHOST

CELERY_BROKER_URL = ''.join([_BROKER_URL_PROTOCOL,_BROKER_URL_USERNAME, ':',
                      _BROKER_URL_PWD, '@', _BROKER_URL_HOST, ':',
                      _BROKER_URL_PORT, '/',_BROKER_URL_VHOST])

#BROKER_URL = 'redis://redis:6379/0'
_RESULT_BACKEND_PROTOCOL = 'redis://'
_RESULT_BACKEND_USERNAME = settings_secret._RESULT_BACKEND_USERNAME
_RESULT_BACKEND_PWD = settings_secret._RESULT_BACKEND_PWD
_RESULT_BACKEND_HOST = settings_secret._RESULT_BACKEND_HOST
_RESULT_BACKEND_PORT = settings_secret._RESULT_BACKEND_PORT
_RESULT_BACKEND_DB = settings_secret._RESULT_BACKEND_DB

CELERY_RESULT_BACKEND = ''.join([_RESULT_BACKEND_PROTOCOL,
                                 _RESULT_BACKEND_HOST, ':', _RESULT_BACKEND_PORT,
                                 '/', _RESULT_BACKEND_DB])

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERYD_HIJACK_ROOT_LOGGER = False
CELERYD_LOG_FORMAT = '[DJANGO] $(processName)s %(levelname)s %(asctime)s %(module)s '\
                     '%(name)s.%(funcName)s:%(lineno)s: %(message)s'

#CELERY_ANOTATIONS = {'designsafe.apps.api.tasks.reindex_agave': {'time_limit': 60 * 15}}
CELERY_DEFAULT_EXCHANGE_TYPE = 'direct'
CELERY_QUEUES = (
    Queue('default', Exchange('default'), routing_key='default'),
    #Use to queue indexing tasks
    Queue('indexing', Exchange('io'), routing_key='io.indexing'),
    #Use to queue tasks which handle files
    Queue('files', Exchange('io'), routing_key='io.files'),
    #Use to queue tasks which mainly call external APIs
    Queue('api', Exchange('api'), routing_key='api.agave'),
    )
CELERY_DEFAULT_QUEUE = 'default'
CELERY_DEFAULT_EXCHANGE = 'default'
CELERY_DEFAULT_ROUTING_KEY = 'default'
