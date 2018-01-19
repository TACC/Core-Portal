#!/bin/bash

##
# Run Celery task queue for development
#
celery -A portal beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule &
celery -A portal worker -l debug --autoreload
