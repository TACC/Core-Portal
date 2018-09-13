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
_PORTAL_APPS_METADATA_NAMES = ['portal_apps']

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
_RT_QUEUE = 'QUEUENAME'

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
_AGAVE_DEFAULT_TRASH_NAME = 'Trash'

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

# TBD

########################
# DJANGO APP: DATA DEPOT
########################

# Absolute path where home directories should be created.
# Absolute with respect to the host
# Use only if all home directories are under one parent directory.
_PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_ABS_PATH = '/home/wma_portal/cep/home_dirs/'
# Relative path from the default sotrage system where home directories
# should be created.
# Use only if all home directories are under one parent directory.
# NOTE: Replace PORTAL_NAME with name of project (e.g. - cep).
_PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_REL_PATH = 'home_dirs'
_PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX = 'cep.dev.home.{}'
_PORTAL_DATA_DEPOT_STORAGE_HOST = 'data.tacc.utexas.edu'
_PORTAL_DATA_DEPOT_PROJECT_SYSTEM_PREFIX = 'cep.project'
_PORTAL_USER_HOME_MANAGER = 'portal.apps.accounts.managers.user_home.UserHomeManager'
_PORTAL_KEYS_MANAGER = 'portal.apps.accounts.managers.ssh_keys.KeysManager'
_PORTAL_USER_ACCOUNT_SETUP_STEPS = [
    'portal.apps.accounts.steps.step_one',
    'portal.apps.accounts.steps.step_two',
    'portal.apps.accounts.steps.StepThree',
]
_PORTAL_DATA_DEPOT_WORK_HOME_DIR_FS = '/work'
_PORTAL_DATA_DEPOT_WORK_HOME_DIR_EXEC_SYSTEM = 'EXECUTION_SYSTEM'

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
