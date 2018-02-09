# README

## TACC Core Experimental Portal

* v0.1.0


### Requirements

* Docker


### Code Configuration

After you clone the repository locally, there are several configuration steps required to prepare the project.

#### Copy the example files for `server/conf`, `server/conf/env_files` and `server/portal/settings`:

_server/conf_

    cd core-exp-portal/server/conf
    cp mysql.sample.cnf mysql.cnf
    cp rabbitmq.sample.conf rabbitmq.conf
    cp redis.sample.conf redis.conf

_server/conf/env_files_

    cd core-exp-portal/server/conf/env_files
    cp mysql.sample.env mysql.env
    cp portal.sample.env portal.env
    cp rabbitmq.sample.env rabbitmq.env

_server/portal/settings_

    cd core-exp-portal/server/portal/settings
    cp elasticsearch.example.py elasticsearch.py
    cp settings_agave.example.py settings_agave.py
    cp settings_celery.example.py settings_celery.py
    cp settings_local.example.py settings_local.py
    cp settings_secret.example.py settings_secret.py


#### Edit the following conf, env_files, nginx and settings files accordingly:

    server/conf/env_files/mysql.env
    server/conf/env_files/rabbitmq.env
    server/conf/nginx/nginx.conf
    server/conf/rabbitmq.conf
    server/portal/settings/settings_agave.py
    server/portal/settings/settings_local.py
    server/portal/settings/settings_secret.py

- _Note: The files `server/conf/env_files/portal.env`, `server/portal/settings/elasticsearch.py` and `server/portal/settings/settings_celery.py` do not require edits though they can be customized to fit the neeeds of the project._


#### Build the image for the portal's django container:

    docker-compose -f ./server/conf/docker/docker-compose.yml build


#### Start the development environment:

    docker-compose -f ./server/conf/docker/docker-compose-dev.all.debug.yml up


#### Install client-side dependencies and bundle code with webpack:

    cd client
    npm install
    npm run build


#### Initialize the application in the `cep_django` container:

    docker exec -it cep_django /bin/bash
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py collectstatic


### Setup local accessing the portal:

  1. Add a record to your local `hosts` file for `127.0.0.1 cep.dev`

    _WARNING: This name **must** match the **agave callback URL** defined for the client in `settings_agave.py` for `AGAVE_TENANT_ID`._

  2. Direct your browser to `https://cep.dev` or `http://cep.dev:8000`. This will display the django CMS default page. To login to the portal, point your browser to `https://cep.dev/accounts/login`.

    _NOTE: When logging in, make sure that you are going through SSL (`https://cep.dev/accounts/login`). After succesful login, you can use the debug server at `http://cep.dev:8000`._

    _NOTE: Evergreen browsers will no longer allow self-signed certificates. Currently Chrome and Firefox Developer Edition deny access to the local portal for this reason. The standard Firefox browser still allows users to create an exception for a self-signed cert. A cert solution needs to be established in alignment with current TACC policies to resolve this._


### TBD

- Fix self-signed certificates issues.
- Refactor app modules.
- Enhance authentication workflow with abaco reactors.
- Enhance DevOps with CI (unit testing, integration testing,  deployment, etc.)
- Setup documentation generation for portal source code.

### Resources

* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)
