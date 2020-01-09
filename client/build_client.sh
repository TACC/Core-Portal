#!/bin/bash -x
if [ "$1" == true ] ; then
    cd /srv/www/portal/client
    rm -rf node_modules/ && rm -rf build/ && npm install && npm run build
else
    echo  'Not building client'
fi
