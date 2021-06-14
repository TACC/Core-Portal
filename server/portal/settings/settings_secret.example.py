"""
All secret values (eg. configurable per project) - usually stored in UT stache.
"""

########################
# DJANGO SETTINGS COMMON
########################

_SECRET_KEY = 'CHANGE ME !'
_DEBUG = True

# Namespace for portal
_PORTAL_NAMESPACE = 'CEP'
_PORTAL_DOMAIN = 'Core Portal'

# NOTE: set _WH_BASE_URL to ngrok redirect for local dev testing (i.e. _WH_BASE_URL = 'https://12345.ngrock.io', see https://ngrok.com/)
_WH_BASE_URL = ''

# Unorganized
_LOGIN_REDIRECT_URL = '/workbench/dashboard'
_SYSTEM_MONITOR_DISPLAY_LIST = ['frontera.tacc.utexas.edu', 'stampede2.tacc.utexas.edu',
                                'lonestar5.tacc.utexas.edu', 'maverick2.tacc.utexas.edu', 'wrangler.tacc.utexas.edu']

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
_RT_QUEUE = 'QUEUE'
_RT_TAG = 'CEP_portal'

########################
# AGAVE SETTINGS
########################

# Admin account
_PORTAL_ADMIN_USERNAME = 'portal_admin'

# Agave Tenant.
_AGAVE_TENANT_ID = 'tenant_name'
_AGAVE_TENANT_BASEURL = 'https://agave.mytenant.org'

# Agave Client Configuration
_AGAVE_CLIENT_KEY = 'TH1$_!$-MY=K3Y!~'
_AGAVE_CLIENT_SECRET = 'TH1$_!$-My=S3cr3t!~'
_AGAVE_SUPER_TOKEN = 'S0m3T0k3n_tHaT-N3v3r=3xp1R35'
_AGAVE_STORAGE_SYSTEM = 'cep.storage.default'
_AGAVE_DEFAULT_TRASH_NAME = 'Trash'

_AGAVE_JWT_HEADER = 'HTTP_X_JWT_ASSERTION_PORTALS'

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

_COMMUNITY_INDEX_SCHEDULE = {}

########################
# CELERY SETTINGS
########################

_RESULT_BACKEND_HOST = 'core_portal_redis'
_RESULT_BACKEND_PORT = '6379'
_RESULT_BACKEND_DB = '0'

########################
# DJANGO APP: WORKSPACE
########################

_PORTAL_APPS_METADATA_NAMES = ['portal_apps']
_PORTAL_ALLOCATION = 'TACC-ACI'
_PORTAL_APPS_DEFAULT_TAB = 'Data Processing'

########################
# DJANGO APP: DATA DEPOT
########################

_PORTAL_KEYS_MANAGER = 'portal.apps.accounts.managers.ssh_keys.KeysManager'

_PORTAL_JUPYTER_URL = "https://jupyter.tacc.cloud"
_PORTAL_JUPYTER_SYSTEM_MAP = {
    "cloud.corral.home.{username}": "/tacc-work",
}

_PORTAL_KEY_SERVICE_ACTOR_ID = ""
_PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT = 'stockyard'
_PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS = {
    'stockyard': {
        'name': 'My Data (Work)',
        'description': 'My Data on Stockyard for {username}',
        'site': 'cep',
        'systemId': 'cloud.corral.home.{username}',
        'host': 'cloud.corral.tacc.utexas.edu',
        'rootDir': '/work/{tasdir}',
        'port': 2222,
        'icon': None,
    },
    'frontera': {
        'name': 'My Data (Frontera)',
        'description': 'My Data on Frontera for {username}',
        'site': 'cep',
        'systemId': 'frontera.home.{username}',
        'host': 'frontera.tacc.utexas.edu',
        'rootDir': '/home1/{tasdir}',
        'port': 22,
        'icon': None,
    },
    'longhorn': {
        'name': 'My Data (Longhorn)',
        'description': 'My Data on Longhorn for {username}',
        'site': 'cep',
        'systemId': 'longhorn.home.{username}',
        'host': 'longhorn.tacc.utexas.edu',
        'rootDir': '/home/{tasdir}',
        'port': 22,
        'requires_allocation': 'longhorn3',
        'icon': None,
    }
}

_PORTAL_DATAFILES_STORAGE_SYSTEMS = [
    {
        'name': 'Community Data',
        'system': 'cep.storage.community',
        'scheme': 'community',
        'api': 'tapis',
        'icon': None
    },
    {
        'name': 'Public Data',
        'system': 'cep.storage.public',
        'scheme': 'public',
        'api': 'tapis',
        'icon': 'publications'
    },
    {
        'name': 'Shared Workspaces',
        'scheme': 'projects',
        'api': 'tapis',
        'icon': None
    },
    {
        'name': 'Google Drive',
        'system': 'googledrive',
        'scheme': 'private',
        'api': 'googledrive',
        'icon': None
    }
]

########################
# DJANGO APP: ONBOARDING
########################
"""
Onboarding steps
Each step is an object, with the full package name of the step class and
an associated settings object.
- If the 'settings' key is omitted, steps will have a default value of None for their settings attribute.
- If the '_PORTAL_USER_ACCOUNT_SETUP_STEPS' secret is set to [], onboarding will be skipped.
Example:
_PORTAL_USER_ACCOUNT_SETUP_STEPS = [
    {
        'step': 'portal.apps.onboarding.steps.test_steps.MockStep',
        'settings': {
            'key': 'value'
        }
    }
]
Sample:
_PORTAL_USER_ACCOUNT_SETUP_STEPS = [
    {
        'step': 'portal.apps.onboarding.steps.mfa.MFAStep',
        'settings': {}
    },
    {
        'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
        'settings': {
            'project_sql_id': 12345
        }
    },
    {
        'step': 'portal.apps.onboarding.steps.allocation.AllocationStep',
        'settings': {}
    },
    {
        'step': 'portal.apps.onboarding.steps.system_creation.SystemCreationStep',
        'settings': {}
    }
]
"""
_PORTAL_USER_ACCOUNT_SETUP_STEPS = []

#######################
# PROJECTS SETTING
#######################
_PORTAL_PROJECTS_SYSTEM_PREFIX = 'cep.project'
_PORTAL_PROJECTS_ID_PREFIX = _PORTAL_NAMESPACE.upper()
_PORTAL_PROJECTS_ROOT_DIR = '/corral-repl/tacc/aci/CEP/projecs'
_PORTAL_PROJECTS_ROOT_SYSTEM_NAME = '{}.root'.format(
    _PORTAL_PROJECTS_SYSTEM_PREFIX
)
_PORTAL_PROJECTS_ROOT_HOST = 'cloud.corral.tacc.utexas.edu'
_PORTAL_PROJECTS_FS_EXEC_SYSTEM_ID = ''
_PORTAL_PROJECTS_PEMS_APP_ID = ''
_PORTAL_PROJECTS_PRIVATE_KEY = ''
_PORTAL_PROJECTS_PUBLIC_KEY = ''

########################
# Custom Portal Template Assets
# Asset path root is static files output dir.
# {% static %} won't work in conjunction with {{ VARIABLE }} so use full paths.
########################
# Default Art.
_PORTAL_ICON_FILENAME = '/static/img/favicon.ico'

########################
# GOOGLE ANALYTICS
########################

# Using test account under personal email.
# To use during dev, Tracking Protection in browser needs to be turned OFF.
# Need to setup an admin account to aggregate tracking properties for portals.
# NOTE: Use the _AGAVE_TENANT_ID URL value when setting up the tracking property.
_GOOGLE_ANALYTICS_PROPERTY_ID = 'UA-XXXXX-Y'

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
# WORKBENCH SETTINGS
########################
"""
This setting dictionary is a catch-all space for simple configuration
flags that will be passed to the frontend to determine what non-standard
components to render.
"""
_WORKBENCH_SETTINGS = {
    "debug": _DEBUG,
    "makeLink": True,
    "viewPath": True,
    "compressApp": 'zippy',
    "extractApp": 'extract',
    "makePublic": True,
    "showWork2Message": True
}
