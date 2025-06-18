"""
All secret values (eg. configurable per project) - usually stored in UT stache.
"""

########################
# DJANGO SETTINGS COMMON
########################

_SECRET_KEY = 'CHANGE ME !'

########################
# DJANGO SETTINGS LOCAL
########################

# Database.
_DJANGO_DB_ENGINE = 'django.db.backends.postgresql'
_DJANGO_DB_HOST = 'core_portal_postgres'
_DJANGO_DB_PORT = '5432'
_DJANGO_DB_NAME = 'dev'
_DJANGO_DB_USER = 'dev'
_DJANGO_DB_PASSWORD = 'dev'

# TAS Authentication.
_TAS_URL = 'https://tas-dev.tacc.utexas.edu/api'
_TAS_CLIENT_KEY = 'key'
_TAS_CLIENT_SECRET = 'secret'

# Redmine Tracker Authentication.
_RT_HOST = 'https://consult.tacc.utexas.edu/REST/1.0'
_RT_UN = 'username'
_RT_PW = 'password'

########################
# TAPIS v2 SETTINGS
########################

# Admin account
_PORTAL_ADMIN_USERNAME = 'portal_admin'

########################
# TAPIS v3 SETTINGS
# NOTE: ONLY USED FOR TAPIS V3 DEVELOPMENT.
# YOU CAN IGNORE THIS FOR TAPIS V2 DEVELOPMENT.
########################

# Tapis Tenant.
_TAPIS_TENANT_BASEURL = 'https://example.tapis.io'

# Tapis Client Configuration
_TAPIS_CLIENT_ID = ''
_TAPIS_CLIENT_KEY = ''

# Long-live portal admin access token
_TAPIS_ADMIN_JWT = ''

########################
# RABBITMQ SETTINGS
########################

_BROKER_URL_USERNAME = 'dev'
_BROKER_URL_PWD = 'dev'
_BROKER_URL_HOST = 'core_portal_rabbitmq'
_BROKER_URL_PORT = '5672'
_BROKER_URL_VHOST = 'dev'

########################
# ELASTICSEARCH SETTINGS
########################

_ES_HOSTS = 'core_portal_elasticsearch:9200'
_ES_AUTH = 'username:password'
_ES_INDEX_PREFIX = 'cep-dev-{}'

########################
# CELERY SETTINGS
########################

_RESULT_BACKEND_HOST = 'core_portal_redis'
_RESULT_BACKEND_PORT = '6379'
_RESULT_BACKEND_DB = '0'

#######################
# PROJECTS SETTINGS
#######################

_PORTAL_PROJECTS_PRIVATE_KEY = ''
_PORTAL_PROJECTS_PUBLIC_KEY = ''

"""
SETTINGS: RECAPTCHA
"""
RECAPTCHA_SECRET_KEY = 'key'
RECAPTCHA_SITE_KEY = 'secret'

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
        "client_secret": "S3CR3T_K3Y",
        "client_id": "XXXXXXX.apps.googleusercontent.com",
        "name": "Google Drive",
        "directory": "external-resources"
    }
}
