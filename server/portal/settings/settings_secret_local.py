"""
All secret values (eg. configurable per project) - usually stored in UT stache.
"""

import os

########################
# DJANGO SETTINGS COMMON
########################

_SECRET_KEY = "CHANGE ME !"

########################
# DJANGO SETTINGS LOCAL
########################

# Database.
_DJANGO_DB_ENGINE = "django.db.backends.postgresql"
_DJANGO_DB_HOST = "core_portal_postgres"
_DJANGO_DB_PORT = "5432"
_DJANGO_DB_NAME = "dev"
_DJANGO_DB_USER = "dev"
_DJANGO_DB_PASSWORD = "dev"

# TAS Authentication.
_TAS_URL = "https://tas.tacc.utexas.edu/api"
_TAS_CLIENT_KEY = "tasportal_dev"
_TAS_CLIENT_SECRET = os.environ.get("TAS_CLIENT_SECRET")

# Redmine Tracker Authentication.
_RT_HOST = "https://consult.tacc.utexas.edu/REST/1.0"
_RT_UN = "rtdev"
_RT_PW = os.environ.get("RT_PW")

########################
# TAPIS v2 SETTINGS
########################

# Agave Tenant.
_AGAVE_TENANT_ID = "portals"
_AGAVE_TENANT_BASEURL = "https://portals-api.tacc.utexas.edu"

# cep.test Agave Client Configuration
_AGAVE_CLIENT_KEY = os.environ.get("AGAVE_CLIENT_KEY")
_AGAVE_CLIENT_SECRET = os.environ.get("AGAVE_CLIENT_SECRET")
_AGAVE_SUPER_TOKEN = os.environ.get("AGAVE_SUPER_TOKEN")

########################
# TAPIS v3 SETTINGS
# NOTE: ONLY USED FOR TAPIS V3 DEVELOPMENT.
# YOU CAN IGNORE THIS FOR TAPIS V2 DEVELOPMENT.
########################

# Admin account
_PORTAL_ADMIN_USERNAME = "wma_prtl"

# Tapis Tenant.
_TAPIS_TENANT_BASEURL = "https://portals.tapis.io"

# Tapis Client Configuration
_TAPIS_CLIENT_ID = "CEP.TEST"
_TAPIS_CLIENT_KEY = os.environ.get("TAPIS_CLIENT_KEY")

# Long-live portal admin access token
_TAPIS_ADMIN_JWT = os.environ.get("TAPIS_ADMIN_JWT")

# Key service token for registering public keys with cloud.corral
_KEY_SERVICE_TOKEN = os.environ.get("KEY_SERVICE_TOKEN")

# !NOTE: DEV TENANT SETTINGS
# _TAPIS_TENANT_BASEURL = 'https://portals.develop.tapis.io'
# _TAPIS_CLIENT_ID = 'CEP.TEST'
# _TAPIS_CLIENT_KEY = os.environ.get(TAPIS_CLIENT_KEY_DEV)
# _TAPIS_ADMIN_JWT = os.environ.get("TAPIS_ADMIN_JWT_DEV")

########################
# RABBITMQ SETTINGS
########################

_BROKER_URL_USERNAME = "dev"
_BROKER_URL_PWD = "dev"
_BROKER_URL_HOST = "core_portal_rabbitmq"
_BROKER_URL_PORT = "5672"
_BROKER_URL_VHOST = "dev"

########################
# ELASTICSEARCH SETTINGS
########################

_ES_HOSTS = "core_portal_elasticsearch:9200"
_ES_AUTH = os.environ.get("ES_AUTH")
_ES_INDEX_PREFIX = "cep-dev-{}"

########################
# CELERY SETTINGS
########################

_RESULT_BACKEND_HOST = "core_portal_redis"
_RESULT_BACKEND_PORT = "6379"
_RESULT_BACKEND_DB = "0"

#######################
# PROJECTS SETTINGS
#######################

_PORTAL_PROJECTS_PRIVATE_KEY = os.environ.get("PORTAL_PROJECTS_PRIVATE_KEY")

_PORTAL_PROJECTS_PUBLIC_KEY = os.environ.get("PORTAL_PROJECTS_PUBLIC_KEY")


########################
# EXTERNAL DATA RESOURCES SETTINGS
########################

# NOTE: set 'name' to that of the custom data api,
# keeping 'directory' set as 'external-resources'.
# The key of each system should be equivalent to the NAME of the FileManager.

# NOTE: Kept as a secret setting so portals can decide what external
# resources to have available.

# For google drive secrets, go to https://console.cloud.google.com/apis

_EXTERNAL_RESOURCE_SECRETS = {
    "google-drive": {
        "client_secret": os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET"),
        "client_id": os.environ.get("GOOGLE_DRIVE_CLIENT_ID"),
        "name": "Google Drive",
        "directory": "external-resources",
    }
}


########################
# reCAPTCHA SETTINGS
########################
_RECAPTCHA_SECRET_KEY = os.environ.get("RECAPTCHA_SECRET_KEY")
_RECAPTCHA_SITE_KEY = os.environ.get("RECAPTCHA_SITE_KEY")


_DATACITE_USER = "tdl.tacc"
_DATACITE_PASS = "CHANGEME"
