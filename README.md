# TACC Frontera Web Portal

* v2.0.0
* Working Design: https://xd.adobe.com/view/db2660cc-1011-4f26-5d31-019ce87c1fe8-ad17/

[![codecov](https://codecov.io/bb/taccaci/frontera-portal/branch/master/graph/badge.svg?token=awjI9tRbqj)](https://codecov.io/bb/taccaci/frontera-portal)

## Prequisites for running the portal application

* Docker
* Docker Compose
* Python 3.6.8
* Nodejs 12.x (LTS)

The Frontera Web Portal can be run using [Docker][1] and [Docker Compose][2]. You will
need both Docker and Docker Compose pre-installed on the system you wish to run the portal
on.

If you are on a Mac or a Windows machine, the recommended method is to install
[Docker Desktop](https://www.docker.com/products/docker-desktop), which will install both Docker and Docker Compose as well as Docker
Machine, which is required to run Docker on Mac/Windows hosts.

### Code Configuration

After you clone the repository locally, there are several configuration steps required to prepare the project.


#### Create settings_secret.py

Create `server/portal/settings/settings_secret.py` containing what is in `secret` field in the `Frontera Web Settings Secret` entry secured on [UT Stache](https://stache.security.utexas.edu)

#### Build the image for the portal's django container:

    docker-compose -f ./server/conf/docker/docker-compose.yml build


#### Start the development environment:

    docker-compose -f ./server/conf/docker/docker-compose-dev.all.debug.yml up


#### Install client-side dependencies and bundle code with webpack:

    cd client
    npm install
    npm run build

-  _Note: During local development you can also use `npm run dev` to set a livereload watch on your local system that will update the portal code in real-time. Again, make sure that you are using NodeJS 12.x and not an earlier version._


#### Initialize the application in the `frontera_prtl_django` container:

    docker exec -it frontera_prtl_django /bin/bash
    python3 manage.py migrate
    python3 manage.py createsuperuser
    python3 manage.py collectstatic


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

### Additional Setup

Follow the Confluence pages below to set up Projects, Notifications, and Elastic Search.

- Projects: https://confluence.tacc.utexas.edu/x/pQCPAQ
- Notifications: https://confluence.tacc.utexas.edu/x/3QnG
- ElasticSearch: https://confluence.tacc.utexas.edu/x/aARkAQ


### Linting and Formatting Conventions

Client-side Javascript code is linted via eslint, and is enforced on commits to the repo. To see a list of linting issues, run `npm run lint` in the console under the `client` folder.

You may need to globally install eslint for these to work: `npm install -g eslint`

You may auto-fix your linting errors to conform with Prettier standards via:
```
eslint ./client --fix
```

Server-side Python code is linted via Flake8, and is also enforced on commits to the repo. To see server side linting errors, run `git diff -U0 master | flake8 --diff` from the command line.
This requires that you have a local python virtual environemnt setup with this project's dependencies installed:

```
python3 -m venv <path_to_local_venv_dir>
. <path_to_local_venv_dir>/bin/activate
pip install -r server/requirements.txt
```

### Testing

Server-side python testing is run through pytest. Run `pytest -ra` from the `server` folder to run backend tests and display a report at the bottom of the output.

Client-side javascript testing is run through Jest. Run `npm run test` from the `client` folder to ensure tests are running correctly.

#### Test Coverage

Coverage is sent to codecov on commits to the repo (see bitbucket pipeline for branch to see branch coverage). Ideally we only merge positive code coverage changes to master.

### Resources

* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)
* [Tapis Project (Formerly Agave)](https://tacc-cloud.readthedocs.io/projects/agave/en/latest/)
