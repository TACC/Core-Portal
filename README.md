# TACC Core Experience Portal

* v0.1.0

## Prequisites for running the portal application

* Docker
* Docker Compose
* Python 2.7.15
* Nodejs 8.x

The CEP Portal can be run using [Docker][1] and [Docker Compose][2]. You will
need both Docker and Docker Compose pre-installed on the system you wish to run the portal
on.

If you are on a Mac or a Windows machine, the recommended method is to install
[Docker Desktop](https://www.docker.com/products/docker-desktop), which will install both Docker and Docker Compose as well as Docker
Machine, which is required to run Docker on Mac/Windows hosts.

### Code Configuration

After you clone the repository locally, there are several configuration steps required to prepare the project.


#### Copy the example files for `server/conf`, `server/conf/env_files` and `server/portal/settings`:

_server/conf_

    cd core-exp-portal/server/conf
    cp rabbitmq.sample.conf rabbitmq.conf
    cp redis.sample.conf redis.conf

_server/conf/env_files_

    cd core-exp-portal/server/conf/env_files
    cp portal.sample.env portal.env
    cp rabbitmq.sample.env rabbitmq.env

_server/portal/settings_

    cd core-exp-portal/server/portal/settings
    cp settings_secret.example.py settings_secret.py


#### Edit the following conf, env_files, nginx and settings files accordingly:

    # server/conf/mysql.cnf
    # No edits required.

    # server/conf/rabbitmq.conf
    # No edits required.

    # server/conf/redis.conf
    # No edits required.

    # server/conf/env_files/portal.env
    # No edits required.

    # server/conf/env_files/rabbitmq.env
    # No edits required

    # server/conf/nginx/nginx.conf
    # No edits required

    # server/portal/settings/settings_secret.py
    # These values will be secured in UT Stache under `CEP_portal_secrets`
    # Do NOT copy the database settings from Stache. Use what was in settings_secret.example.py
    # Make sure you keep the DJANGO APP: DATA DEPOT information from settings_secret.example.py


- _Note: Those files that do not require edits may still need to be customized to fit the neeeds of the project. Edit them as necessary._


#### Build the image for the portal's django container:

    docker-compose -f ./server/conf/docker/docker-compose.yml build


#### Start the development environment:

    docker-compose -f ./server/conf/docker/docker-compose-dev.all.debug.yml up


#### Install client-side dependencies and bundle code with webpack:

    cd client
    npm install
    npm run build

-  _Note: During local development you can also use `npm run dev` to set a livereload watch on your local system that will update the portal code in real-time. Again, make sure that you are using NodeJS 8.x and not an earlier version_ 


#### Initialize the application in the `cep_django` container:

    docker exec -it cep_django /bin/bash
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py collectstatic


### Setup local accessing the portal:

  1. Add a record to your local `hosts` file for `127.0.0.1 cep.dev`

    _WARNING: This name **must** match the **agave callback URL** defined for the client in `settings_agave.py` for `AGAVE_TENANT_ID`._

    _Note: Do NOT have your VPN connected when you do this.  Otherwise your hosts file will be overwritten and you will have to do this step again._

  2. Direct your browser to `https://cep.dev` or `http://cep.dev:8000`. This will display the django CMS default page. To login to the portal, point your browser to `https://cep.dev/accounts/login`.

    _NOTE: When logging in, make sure that you are going through SSL (`https://cep.dev/accounts/login`). After succesful login, you can use the debug server at `http://cep.dev:8000`._

    _NOTE: Evergreen browsers will no longer allow self-signed certificates. Currently Chrome and Firefox deny access to the local portal for this reason. A cert solution needs to be established in alignment with current TACC policies to resolve this._

### Installing local CA

For your browser to open your local development environment, you need to configure your computer to accept the development environment's self-signed certificates.
Every file needed is in `conf/nginx/certs`.

#### OSX

1. Open mac's Keychain Access
2. File > Import Items
3. Navigate to `./server/conf/nginx/certificates`
4. Select `ca.pem`
5. Search for CEP and double click on the certificate
6. In the Trust section, find the "When using this certificate" dropdown and select "Always Trust"
7. Close the window to save.

#### Linux

1. `$ cd ./server/conf/nginx/certificates`
2. `$ sudo mkdir /usr/local/share/ca-certificates/extra`
3. `$ sudo cp ca.pem /usr/local/share/ca-certificates/extra/cepCA.pem`
4. `$ sudo update-ca-certificates`

#### Firefox UI

1. Go to preferences
3. Search for Authorities
4. Click on "View Certificates" under "Certificates"
5. On the Certificate Manager go to the "Authorities" tab
6. Click on "Import..."
7. Browse to `./server/conf/nginx/certificates`
8. Select `ca.pem`

#### Firefox CLI (not tested)

1. `sudo apt-get install libnss3-tools` (or proper package manager)
2. `certutil -A -n "cepCA" -t "TCu,Cu,Tu" -i ca.pem -d ${DBDIR}`
3. `$DBDIR` differs from browser to browser for more info:
    Chromium: https://chromium.googlesource.com/chromium/src/+/master/docs/linux_cert_management.md
    Firefox: https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data?redirectlocale=en-US&redirectslug=Profiles#How_to_find_your_profile

### Creating Local CA and signed cert

1. Generate RSA-2048 key for CA: `openssl genrsa -des3 -out ca.key 2048` (This file should already be in the repo)
2. Generate root CA certificate: `openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.pem` (Root CA cert is valid for 365 days. Keep any form values to "CEP CA")
3. Generate RSA-2048 key for local dev site: `openssl genrsa out cep.dev.key 2048` (This file should already be in the repo)
4. Generate Cert Request (CSR): `openssql req -new -key -cep.dev.key -out cep.dev.csr` (Keep any form values to "CEP CA")
5. Make sure `cep.dev.ext` is correct
6. Generate Cert: `openssl x509 -req -in cep.dev.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out cep.dev.crt -days 365 -sha256 -extfile cep.dev.ext` (Cert is valid for 365 days. Keep default form values defined in .conf file)
7. Files created: `cep.dev.key` (site private key), `cep.dev.csr` (site certificate signing request), `cep.dev.crt` (actual site certificate), `ca.key` (CA private key) and `ca.pem` (CA certificate).


### TBD

- Update Ansible scripts to support CEP deployment to staging VM (currently still configured for SD2E deployment).
- Choose either conf or env for config and eliminate the redundancy in setup (using ansible to inject env vars into containers).
- Fix self-signed certificates issues.
- Refactor app modules.
- Enhance authentication workflow with abaco reactors.
- Enhance user data storage setup with Celery task.
- Enhance DevOps with CI (unit testing, integration testing,  deployment, etc.)
- Generate documentation for portal source code (sphinx?)


### Resources

* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)
