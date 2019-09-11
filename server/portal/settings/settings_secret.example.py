"""
All secret values (eg. configurable per project) - usually stored in UT stache.
"""

########################
# DJANGO SETTINGS COMMON
########################

_SECRET_KEY = 'CHANGE ME !'
_DEBUG = True

#_WSGI_APPLICATION = 'ws4redis.django_runserver.application'  # DEV
_WSGI_APPLICATION = 'portal.wsgi.application'  # PROD

# Namespace for portal
_PORTAL_NAMESPACE = 'CEP'
_PORTAL_DOMAIN = 'cep.dev'

# Admin account
_PORTAL_ADMIN_USERNAME = 'portal_admin'

########################
# DJANGO SETTINGS LOCAL
########################

# Database.
_DJANGO_DB_ENGINE= 'django.db.backends.postgresql'
_DJANGO_DB_HOST= 'cep_prtl_postgres'
_DJANGO_DB_PORT= '5432'
_DJANGO_DB_NAME= 'dev'
_DJANGO_DB_USER= 'dev'
_DJANGO_DB_PASSWORD= 'dev'

# TAS Authentication.
_TAS_URL='https://tas-dev.tacc.utexas.edu/api'
_TAS_CLIENT_KEY='key'
_TAS_CLIENT_SECRET='secret'

# Redmine Tracker Authentication.
_RT_HOST='https://consult.tacc.utexas.edu/REST/1.0'
_RT_UN='username'
_RT_PW='password'
_RT_QUEUE = 'QUEUE'
_RT_TAG = 'CEP_portal'

# Recaptcha Authentication.
_RECAPTCHA_PUBLIC_KEY='public_key'
_RECAPTCHA_PRIVATE_KEY='private_key'
_RECAPTCHA_USE_SSL='True'
_NOCAPTCHA='True'

_REQUEST_ACCESS=False

########################
# AGAVE SETTINGS
########################

# Agave Tenant.
_AGAVE_TENANT_ID = 'tenant_name'
_AGAVE_TENANT_BASEURL = 'https://agave.mytenant.org'

# Agave Client Configuration
_AGAVE_CLIENT_KEY = 'TH1$_!$-MY=K3Y!~'
_AGAVE_CLIENT_SECRET = 'TH1$_!$-My=S3cr3t!~'
_AGAVE_SUPER_TOKEN = 'S0m3T0k3n_tHaT-N3v3r=3xp1R35'
_AGAVE_STORAGE_SYSTEM = 'my.storage.default'
_AGAVE_COMMUNITY_DATA_SYSTEM = 'storage_system'
_AGAVE_PUBLIC_DATA_SYSTEM = 'storage_system'
_AGAVE_DEFAULT_TRASH_NAME = 'Trash'

_AGAVE_JWT_HEADER = 'HTTP_X_JWT_ASSERTION_PORTALS'

########################
# RABBITMQ SETTINGS
########################

_BROKER_URL_USERNAME = 'dev'
_BROKER_URL_PWD = 'dev'
_BROKER_URL_HOST = 'cep_prtl_rabbitmq'
_BROKER_URL_PORT = '5672'
_BROKER_URL_VHOST = 'dev'

_RESULT_BACKEND_USERNAME = 'dev'
_RESULT_BACKEND_PWD = 'dev'
_RESULT_BACKEND_HOST = 'cep_prtl_redis'
_RESULT_BACKEND_PORT = '6379'
_RESULT_BACKEND_DB = '0'

########################
# ELASTICSEARCH SETTINGS
########################

_ES_HOSTS = 'cep_prtl_elasticsearch'

########################
# CELERY SETTINGS
########################

# TBD.

########################
# LOGGING SETTINGS
########################

# TBD.

########################
# DJANGO APP: WORKSPACE
########################

_PORTAL_APPS_METADATA_NAMES = ['portal_apps']
_PORTAL_ALLOCATION = 'TACC-ACI'

# NOTE: set _WH_BASE_URL to ngrok redirect for local dev testing (i.e. _WH_BASE_URL = 'https://12345.ngrock.io', see https://ngrok.com/)
_WH_BASE_URL = ''

########################
# DJANGO APP: DATA DEPOT
########################

# Absolute path where home directories should be created.
# Absolute with respect to the host
# Use only if all home directories are under one parent directory.
_PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_ABS_PATH = '/corral-repl/tacc/aci/CEP/home_dirs/'
# Relative path from the default sotrage system where home directories
# should be created.
# Use only if all home directories are under one parent directory.
# NOTE: Replace PORTAL_NAME with name of project (e.g. - cep).
_PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_REL_PATH = 'home_dirs'
_PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX = 'cep.dev.home.{}'
_PORTAL_DATA_DEPOT_STORAGE_HOST = 'data.tacc.utexas.edu'
_PORTAL_USER_HOME_MANAGER = 'portal.apps.accounts.managers.user_home.UserHomeManager'
_PORTAL_KEYS_MANAGER = 'portal.apps.accounts.managers.ssh_keys.KeysManager'
_PORTAL_USER_ACCOUNT_SETUP_STEPS = [ ]
_PORTAL_DATA_DEPOT_WORK_HOME_DIR_FS = '/work'
_PORTAL_DATA_DEPOT_WORK_HOME_DIR_EXEC_SYSTEM = 'EXECUTION_SYSTEM'
_PORTAL_JUPYTER_URL = "https://jupyter.tacc.cloud"
_PORTAL_JUPYTER_SYSTEM_MAP = {
    "cep.home.{username}" : "/tacc-work",
}

#######################
# PROJECTS SETTING
#######################
_PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX = 'cep.project'
_PORTAL_PROJECTS_NAME_PREFIX = _PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX
_PORTAL_PROJECTS_ID_PREFIX = _PORTAL_NAMESPACE.upper()
_PORTAL_PROJECTS_ROOT_DIR = '/corral-repl/tacc/aci/CEP/projecs'
_PORTAL_PROJECTS_ROOT_SYSTEM_NAME = '{}.root'.format(
    _PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX
)
_PORTAL_PROJECTS_ROOT_HOST = _PORTAL_DATA_DEPOT_STORAGE_HOST
_PORTAL_PROJECTS_PRIVATE_KEY = ''
_PORTAL_PROJECTS_PUBLIC_KEY = ''
_PORTAL_PROJECTS_FS_EXEC_SYSTEM_ID = ''
_PORTAL_PROJECTS_PEMS_APP_ID = ''
_PORTAL_USER_ACCOUNT_SETUP_WEBHOOK_PWD = '123'

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


########################
# DJANGO CMS SETTINGS
########################

# CMS Site (allows for multiple sites on a single CMS)
_SITE_ID=1

_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': 'cep_prtl_elasticsearch:9200/',
        'INDEX_NAME': 'cms',
    }
}

_COMMUNITY_INDEX_SCHEDULE = None

########################
# Custom Portal Template Assets
# Asset path root is static files output dir.
# {% static %} won't work in conjunction with {{ VARIABLE }} so use full paths.
########################

# No Art.
#_PORTAL_ICON_FILENAME=''                 # Empty string yields NO icon.
_PORTAL_LOGO_FILENAME=''                  # Empty string yields text 'CEP'.
#_PORTAL_NAVBAR_BACKGROUND_FILENAME=''    # Empty string yields NO bg art.

# Defaul Art.
_PORTAL_ICON_FILENAME='/static/img/favicon.ico'
#_PORTAL_LOGO_FILENAME='/static/img/TACC.A.png'
_PORTAL_NAVBAR_BACKGROUND_FILENAME=''

# Custom Art (example using old CEP art).
#_PORTAL_ICON_FILENAME='/static/img/favicon.cep.png'
#_PORTAL_LOGO_FILENAME='/static/img/logo.cep.png'
#_PORTAL_NAVBAR_BACKGROUND_FILENAME='/static/img/network-Header.jpg'

########################
# GOOGLE ANALYTICS
########################

# Using test account under personal email.
# To use during dev, Tracking Protection in browser needs to be turned OFF.
# Need to setup an admin account to aggregate tracking properties for portals.
# NOTE: Use the _AGAVE_TENANT_ID URL value when setting up the tracking property.
_GOOGLE_ANALYTICS_PROPERTY_ID = 'UA-XXXXX-Y'
_GOOGLE_ANALYTICS_PRELOAD = True
