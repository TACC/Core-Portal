#!/usr/bin/env bash

{ npm --prefix=/srv/www/portal/client run-script dev & python /srv/www/portal/server/manage.py runserver 0.0.0.0:8000; }
