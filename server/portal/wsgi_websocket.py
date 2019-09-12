"""
WSGI config for portal project websockets.

For more information on this file, see
https://django-websocket-redis.readthedocs.org/en/latest/running.html#django-with-websockets-for-redis-behind-nginx-using-uwsgi
"""

import os
import gevent.socket
import redis.connection
redis.connection.socket = gevent.socket
os.environ.update(DJANGO_SETTINGS_MODULE='portal.settings.settings')
from ws4redis.uwsgi_runserver import uWSGIWebsocketServer
application = uWSGIWebsocketServer()
