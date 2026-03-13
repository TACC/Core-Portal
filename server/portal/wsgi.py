"""
WSGI config for server project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/howto/deployment/wsgi/
"""

# Patch Python's socket/threading primitives before app loads so gevent can
# context-switch during I/O (e.g. Tapis HTTP calls) instead of blocking the worker.
# uWSGI's --gevent-monkey-patch runs too late (after app loads), so insetad of that
# we patch here.
# https://uwsgi-docs.readthedocs.io/en/latest/Gevent.html
from gevent import monkey
monkey.patch_all()

# psycopg2 uses a C extension that bypasses Python's socket layer, so monkey.patch_all()
# alone doesn't reach it. patch_psycopg() makes DB queries non-blocking under gevent.
# Required when using gevent + psycopg2 (Django's postgresql backend uses psycopg2).
from psycogreen.gevent import patch_psycopg
patch_psycopg()

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portal.settings.settings')
application = get_wsgi_application()
