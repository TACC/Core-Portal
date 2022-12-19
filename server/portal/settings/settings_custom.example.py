"""
All secret values (eg. configurable per project) - usually stored in UT stache.
"""

########################
# DJANGO SETTINGS COMMON
########################

_DEBUG = True

# Namespace for portal
_PORTAL_NAMESPACE = 'CEP'
_PORTAL_DOMAIN = 'Core Portal'

# NOTE: set _WH_BASE_URL to ngrok redirect for local dev testing (i.e. _WH_BASE_URL = 'https://12345.ngrock.io', see https://ngrok.com/)
_WH_BASE_URL = ''

# To authenticate a user with the CMS after Portal login,
# set the _LOGIN_REDIRECT_URL to the custom cms auth endpoint
# otherwise just redirect to /workbench/dashboard
_LOGIN_REDIRECT_URL = '/remote/login/'
_LOGOUT_REDIRECT_URL = '/cms/logout/'

_SYSTEM_MONITOR_DISPLAY_LIST = ['Stampede2', 'Lonestar6', 'Frontera', 'Maverick2']

########################
# DJANGO SETTINGS LOCAL
########################

_RT_QUEUE = 'Web & Mobile Apps'
_RT_TAG = 'core_portal'

########################
# AGAVE SETTINGS
########################

_AGAVE_STORAGE_SYSTEM = 'cep.storage.default'
_AGAVE_DEFAULT_TRASH_NAME = 'Trash'

_AGAVE_JWT_HEADER = 'HTTP_X_JWT_ASSERTION_PORTALS'

########################
# ELASTICSEARCH SETTINGS
########################

_COMMUNITY_INDEX_SCHEDULE = {}

########################
# DJANGO APP: WORKSPACE
########################

_PORTAL_APPS_METADATA_NAMES = ["portal_apps", "portal_apps_dev"]
_PORTAL_ALLOCATION = 'TACC-ACI'
_PORTAL_APPS_DEFAULT_TAB = 'Data Processing'

########################
# DJANGO APP: DATA DEPOT
########################

_PORTAL_KEYS_MANAGER = 'portal.apps.accounts.managers.ssh_keys.KeysManager'

_PORTAL_JUPYTER_URL = "https://jupyter.tacc.cloud"
_PORTAL_JUPYTER_SYSTEM_MAP = {
    "cloud.corral.work.{username}": "/tacc-work",
}

_PORTAL_KEY_SERVICE_ACTOR_ID = ""
_PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT = 'stockyard'
_PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS = {
    'stockyard': {
        'name': 'My Data (Work)',
        'description': 'My Data on Stockyard for {username}',
        'site': 'cep',
        'systemId': 'cloud.corral.work.{username}',
        'host': 'cloud.corral.tacc.utexas.edu',
        'rootDir': '/work/{tasdir}',
        'port': 2222,
        'icon': None,
        'hidden': False,
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
        'hidden': False,
    },
}

_PORTAL_DATAFILES_STORAGE_SYSTEMS = [
    {
        'name': 'Community Data',
        'system': 'cep.storage.community',
        'scheme': 'community',
        'api': 'tapis',
        'icon': None,
        'siteSearchPriority': 1
    },
    {
        'name': 'Public Data',
        'system': 'cep.storage.public',
        'scheme': 'public',
        'api': 'tapis',
        'icon': 'publications',
        'siteSearchPriority': 0
    },
    {
        'name': 'Shared Workspaces',
        'scheme': 'projects',
        'api': 'tapis',
        'icon': 'publications',
        'privilegeRequired': False,
        'readOnly': False,
        'hideSearchBar': False
    },
    {
        'name': 'Google Drive',
        'system': 'googledrive',
        'scheme': 'private',
        'api': 'googledrive',
        'icon': None,
        'integration': 'portal.apps.googledrive_integration'
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
        'step': 'portal.apps.onboarding.steps.allocation.AllocationStep',
        'settings': {}
    },
    {
        'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
        'settings': {
            'project_sql_id': 12345,
            'rt_queue': 'Life Sciences'     # Defaults to 'Accounting' if left blank
        }
    },
    {
        'step': 'portal.apps.onboarding.steps.system_access.SystemAccessStep',
        'settings': {
            'required_systems': ['stampede2.tacc.utexas.edu','ls5.tacc.utexas.edu'],
            'project_sql_id': 12345,
            'rt_queue': 'Life Sciences'     # Defaults to 'Accounting' if left blank
        }
    },
    {
        'step': 'portal.apps.onboarding.steps.system_creation.SystemCreationStep',
        'settings': {}
    }
]
"""

_PORTAL_USER_ACCOUNT_SETUP_STEPS = [
    {
        'step': 'portal.apps.onboarding.steps.mfa.MFAStep',
        'settings': {}
    },
    {
        'step': 'portal.apps.onboarding.steps.allocation.AllocationStep',
        'settings': {}
    },
    {
        'step': 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
        'settings': {
            'tapis_systems': ['cloud.data.community'],
        }
    },
]

#######################
# PROJECTS SETTINGS
#######################

_PORTAL_PROJECTS_SYSTEM_PREFIX = 'cep.project'
_PORTAL_PROJECTS_ID_PREFIX = 'CEP'
_PORTAL_PROJECTS_ROOT_DIR = '/corral-repl/tacc/aci/CEP/projects'
_PORTAL_PROJECTS_ROOT_SYSTEM_NAME = 'cep.project.root'
_PORTAL_PROJECTS_ROOT_HOST = 'cloud.corral.tacc.utexas.edu'
_PORTAL_PROJECTS_SYSTEM_PORT = "2222"
_PORTAL_PROJECTS_FS_EXEC_SYSTEM_ID = "cep.project.admin.data.cli"
_PORTAL_PROJECTS_PEMS_APP_ID = "cep.cloud.admin-pems-0.1"

########################
# Custom Portal Template Assets
# Asset path root is static files output dir.
# {% static %} won't work in conjunction with {{ VARIABLE }} so use full paths.
########################

# No Art.
# _PORTAL_ICON_FILENAME=''                 # Empty string yields NO icon.

# Default Art.
_PORTAL_ICON_FILENAME = '/static/site_cms/img/favicons/favicon.ico'

########################
# GOOGLE ANALYTICS
########################

# Using test account under personal email.
# To use during dev, Tracking Protection in browser needs to be turned OFF.
# Need to setup an admin account to aggregate tracking properties for portals.
# NOTE: Use the _AGAVE_TENANT_ID URL value when setting up the tracking property.
_GOOGLE_ANALYTICS_PROPERTY_ID = 'UA-XXXXX-Y'

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
    "makePublic": False,
    "hideApps": False,
    "hideDataFiles": False,
    "hideAllocations": False,
    "showSubmissions": False,
    "hideManageAccount": False,
    "hasUserGuide": True,
    "hideFeedback": False,
    "onboardingCompleteRedirect": '/workbench/',
    "noPHISystem": "",
    "customDashboardSection": {
        "header": "My Account",
        "links": [
            {
                "href": 'https://utexas.edu',
                "text": 'Update Profile and Email Address',
            },
            {
                "href": 'https://utexas.edu',
                "text": 'Change Password',
            }
        ]
    }
}
