# TACC Core Portal

* Working Design: https://xd.adobe.com/view/db2660cc-1011-4f26-5d31-019ce87c1fe8-ad17/

[![codecov](https://codecov.io/gh/TACC/Core-Portal/branch/main/graph/badge.svg?token=TM9CH1AHJ1)](https://codecov.io/gh/TACC/Core-Portal)

## Prequisites for running the portal application

* Docker 20.10.7
* Docker Compose 1.29.2
* Python 3.6.8
* Nodejs 12.x (LTS)

The Core Portal can be run using [Docker][1] and [Docker Compose][2]. You will
need both Docker and Docker Compose pre-installed on the system you wish to run the portal
on.

If you are on a Mac or a Windows machine, the recommended method is to install
[Docker Desktop](https://www.docker.com/products/docker-desktop), which will install both Docker and Docker Compose as well as Docker
Machine, which is required to run Docker on Mac/Windows hosts.

### Code Configuration

After you clone the repository locally, there are several configuration steps required to prepare the project.


#### Create settings_secret.py, settings_local.py, and secrets.py

- Create `server/portal/settings/settings_secret.py` containing what is in `secret` field in the `Core Portal Settings Secret` entry secured on [UT Stache](https://stache.security.utexas.edu)

- Copy `server/portal/settings/settings_local.example.py` to `server/portal/settings/settings_local.py`
	 - _Note: Update `PORTAL_PROJECTS_ID_PREFIX` in `settings_local.py` to be something unique (like `USERNAME.CEP`) so that project creation in your local development does not clash with other development work (as directories and Tapis storage system names will be created using this prefix)._
    - _Note: [Setup ngrok](#setting-up-notifications-locally) and update `WH_BASE_URL` in `settings_local.py` to enable webhook notifications locally._

- Copy `server/conf/cms/secrets.sample.py` to `server/conf/cms/secrets.py`

#### Build the image for the portal's django container:
    make build
OR

    docker-compose -f ./server/conf/docker/docker-compose.yml build


#### Start the development environment:
    make start
OR

    docker-compose -f ./server/conf/docker/docker-compose-dev.all.debug.yml up


#### Install client-side dependencies and bundle code with webpack:

    cd client
    npm ci
    npm run build

-  _Note: During local development you can also use `npm run dev` to set a livereload watch on your local system that will update the portal code in real-time. Again, make sure that you are using NodeJS 12.x and not an earlier version. You will also need the port 8080 available locally._


#### Initialize the application in the `core_portal_django` container:

    docker exec -it core_portal_django /bin/bash
    python3 manage.py migrate
    python3 manage.py collectstatic --noinput
    python3 manage.py createsuperuser  # Unless you will only login with your TACC account
    python3 manage.py projects_id --update-using-max-value-found # Update projects id counter
    python3 manage.py import-apps # Add set of example apps used in Frontnera portal (optional)

#### Initialize the CMS in the `core_portal_cms` container:
First, copy the sample secrets:

    cp server/conf/cms/secrets.sample.py server/conf/cms/secrets.py

Then, run migrations and `collectstatic`:
```
    docker exec -it core_portal_cms /bin/bash
    python3 manage.py migrate
    python3 manage.py collectstatic --noinput
    python3 manage.py createsuperuser
```
Finally, create a home page in the CMS.

*NOTE*: TACC VPN or physical connection to the TACC network is required To log-in to CMS using LDAP, otherwise the password set with `python3 manage.py createsuperuser` is used

### Setting up search index:

Requirements:
- At least one page in CMS (see above).
- At least [15% of free disk space](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html).
- For Mac/Windows
    - At least 4GB of RAM allocated to Docker (see Docker Desktop > Preferences > Resources > Advanced).
- For Linux (Locally)
    - Run `sudo sysctl -w vm.max_map_count=2146999999` (The minimum required by [ES](https://www.elastic.co/guide/en/elasticsearch/reference/master/_maximum_map_count_check.html) is 262144 but it doesn't seem to work).
    - Run `sudo sysctl -w vm.overcommit_memory=1`.
    - Run `sudo sysctl -p` (In order to persist in `/etc/sysctl.conf`).

First, rebuild the cms search index:
```
    docker exec -it core_portal_cms /bin/bash
    python3 manage.py rebuild_index
```
Then, use the django shell in the `core_portal_django` container—
```
    docker exec -it core_portal_django /bin/bash
    python3 manage.py shell
```
—to run the following code to set up the search index:
```
from portal.libs.elasticsearch.indexes import setup_files_index, setup_projects_index, setup_allocations_index
setup_files_index(force=True)
setup_projects_index(force=True)
setup_allocations_index(force=True)
```

### Setting up notifications locally:

1. Run an [ngrok](https://ngrok.com/download) session to route webhooks to `core_portal_nginx`:
```
ngrok http 443
```
2. Then, take the `https` url generated by ngrok and paste it into the `WH_BASE_URL` setting in `settings_local.py`


### Setup local access to the portal:

  1. Add a record to your local `hosts` file for `127.0.0.1 cep.dev`

    _WARNING: This name **must** match the **agave callback URL** defined for the client in `settings_secret.py` for `_AGAVE_TENANT_ID`._

    _Note: Do NOT have your VPN connected when you do this.  Otherwise your hosts file will be overwritten and you will have to do this step again._

  2. Direct your browser to `https://cep.dev`. This will display the django CMS default page. To login to the portal, point your browser to `https://cep.dev/login`.

    _NOTE: When logging in, make sure that you are going through SSL (`https://cep.dev/login`). After succesful login, you can use the debug server at `https://cep.dev`._

    _NOTE: Evergreen browsers will no longer allow self-signed certificates. Currently Chrome and Firefox deny access to the local portal for this reason. A cert solution needs to be established in alignment with current TACC policies to resolve this._

### Installing local CA

For your browser to open your local development environment, you need to configure your computer to accept the development environment's self-signed certificates.
Every file needed is in `conf/nginx/certificates`.

NOTE: This may require a computer restart to take effect.

#### OSX

1. Open mac's Keychain Access
2. With Default Keychains > login selected, choose File > Import Items... from the menu.
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

### Additional Setup

Follow the Confluence pages below to set up Projects, Notifications, and Elastic Search.

- Projects: https://confluence.tacc.utexas.edu/x/pQCPAQ
- Notifications: https://confluence.tacc.utexas.edu/x/3QnG
- ElasticSearch: https://confluence.tacc.utexas.edu/x/aARkAQ


### Linting and Formatting Conventions

Client-side code is linted (JavaScript via `eslint`, CSS via `stylelint`), and is enforced on commits to the repo. To see a list of linting issues, in the console:

1. Navigate to `client/` directory.
1. Run `npm run lint`, which is the same as linting both languages independently:
    - `npm run lint:js`
    - `npm run lint:css`

You may auto-fix your linting errors to conform with configured standards, for specific languages, via:
- `npm run lint:js -- --fix`
- `npm run lint:css -- --fix`

Server-side Python code is linted via Flake8, and is also enforced on commits to the repo. To see server side linting errors, run `git diff -U0 main | flake8 --diff` from the command line.
This requires that you have a local python virtual environemnt setup with this project's dependencies installed:

```
python3 -m venv <path_to_local_venv_dir>
. <path_to_local_venv_dir>/bin/activate
pip install -r server/requirements.txt
```

### Testing

Server-side python testing is run through pytest. Run `pytest -ra` from the `server` folder to run backend tests and display a report at the bottom of the output.

Client-side javascript testing is run through Jest. Run `npm run test`* from the `client` folder to ensure tests are running correctly.

\* To run tests without console logging, run `npm run test -- --silent`.

#### Test Coverage

Coverage is sent to codecov on commits to the repo (see Github Actions for branch to see branch coverage). Ideally we only merge positive code coverage changes to `main`.


#### Production Deployment

The Core Portal runs in a Docker container as part of a set of services managed with Docker Compose.

Portal images are built by [Jenkins](https://jenkins01.tacc.utexas.edu/view/WMA%20CEP/job/Core_Portal_Build/) and published to the [Docker Hub repo](https://hub.docker.com/repository/docker/taccwma/core-portal).

To update the portal in production or dev, the corresponding [Core Portal Deployments](https://github.com/TACC/Core-Portal-Deployments) env file should be updated with a tag matching an image previously built and published to the taccwma/core-portal repo.

Deployments are initiated via [Jenkins](https://jenkins01.tacc.utexas.edu/view/WMA%20CEP/job/Core_Portal_Deploy/) and orchestrated, tracked, and directed by [Camino](https://github.com/TACC/Camino) on the target server.

### Deployment Steps

1. Build and publish portal image with [Jenkins](https://jenkins01.tacc.utexas.edu/view/WMA%20CEP/job/Core_Portal_Build/)
2. Update deployment settings, particularly the `PORTAL_TAG` environment variable in [Core Portal Deployments](https://github.com/TACC/Core-Portal-Deployments) with new tag name
3. Deploy new image with [Jenkins](https://jenkins01.tacc.utexas.edu/view/WMA%20CEP/job/Core_Portal_Deploy/)

### Contributing

#### Development Workflow
We use a modifed version of [GitFlow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) as our development workflow. Our [development site](https://dev.cep.tacc.utexas.edu) (accessible behind the TACC Network) is always up-to-date with `main`, while the [production site](https://prod.cep.tacc.utexas.edu) is built to a hashed commit tag.
- Feature branches contain major updates, bug fixes, and hot fixes with respective branch prefixes:
    - `task/` for features and updates
    - `bug/` for bugfixes
    - `fix/` for hotfixes

#### Best Practices
Sign your commits ([see this link](https://help.github.com/en/github/authenticating-to-github/managing-commit-signature-verification) for help)

### Resources

* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)
* [Tapis Project (Formerly Agave)](https://tacc-cloud.readthedocs.io/projects/agave/en/latest/)


<!-- Link Aliases -->

[Core-CMS]: https://github.com/TACC/Core-CMS "Core CMS"
[Camino]: https://github.com/TACC/Camino "Camino (Deployment)"
