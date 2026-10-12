#!/bin/bash -x
cd /srv/www/portal/client
pnpm ci && pnpm run build
