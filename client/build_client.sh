#!/bin/bash -x
cd /srv/www/portal/client
npm ci && npm run build
