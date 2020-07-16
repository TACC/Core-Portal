#!/bin/bash -x
if [ "$1" == true ] ; then
    cd /srv/www/portal/client
    npm ci && npm run build
else
    echo  'Not building client'
fi
