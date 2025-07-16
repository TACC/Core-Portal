"""
All secret values (eg. configurable per project) - usually stored in UT stache.
"""

########################
# DJANGO SETTINGS COMMON
########################

_DEBUG = True

# Namespace for portal
_PORTAL_NAMESPACE = "CEP"

_VANITY_BASE_URL = "https://cep.test"

# To authenticate a user with the CMS after Portal login,
# set the _LOGIN_REDIRECT_URL to the custom cms auth endpoint
# otherwise just redirect to /workbench/dashboard
_LOGIN_REDIRECT_URL = "/remote/login/"
_LOGOUT_REDIRECT_URL = "/cms/logout/"

_SYSTEM_MONITOR_DISPLAY_LIST = ["Stampede3", "Lonestar6", "Frontera", "Vista"]

########################
# DJANGO SETTINGS LOCAL
########################

_RT_QUEUE = "Web & Mobile Apps"
_RT_TAG = "core_portal"
_CSRF_TRUSTED_ORIGINS = ["https://cep.test"]

########################
# TAPIS SETTINGS
########################

_AGAVE_JWT_HEADER = "HTTP_X_JWT_ASSERTION_PORTALS"

########################
# ELASTICSEARCH SETTINGS
########################

_COMMUNITY_INDEX_SCHEDULE = {}

########################
# DJANGO APP: WORKSPACE
########################

_PORTAL_APPS_NAMES_SEARCH = ["ALL", _PORTAL_NAMESPACE]
_PORTAL_ALLOCATION = "TACC-ACI"
_PORTAL_APPS_DEFAULT_TAB = ""

########################
# DJANGO APP: DATA DEPOT
########################

_TAPIS_DEFAULT_TRASH_NAME = ".Trash"

_PORTAL_KEYS_MANAGER = "portal.apps.accounts.managers.ssh_keys.KeysManager"

_PORTAL_DATAFILES_STORAGE_SYSTEMS = [
    {
        "name": "My Data (Work)",
        "system": "cloud.data",
        "scheme": "private",
        "api": "tapis",
        "homeDir": "/work/{tasdir}",
        "icon": None,
        "default": True,
    },
    {
        "name": "My Data (Frontera Scratch)",
        "system": "frontera",
        "scheme": "private",
        "api": "tapis",
        "homeDir": "/scratch1/{tasdir}",
        "icon": None,
    },
    {
        "name": "My Data (Frontera Home)",
        "system": "frontera",
        "scheme": "private",
        "api": "tapis",
        "homeDir": "/home1/{tasdir}",
        "icon": None,
    },
    {
        "name": "Community Data",
        "system": "cloud.data",
        "scheme": "community",
        "api": "tapis",
        "homeDir": "/corral/tacc/aci/CEP/community",
        "icon": None,
        "siteSearchPriority": 1,
    },
    {
        "name": "Public Data",
        "system": "cloud.data",
        "scheme": "public",
        "api": "tapis",
        "homeDir": "/corral/tacc/aci/CEP/public",
        "icon": "publications",
        "siteSearchPriority": 0,
    },
    {
        "name": "Shared Workspaces",
        "scheme": "projects",
        "api": "tapis",
        "icon": "publications",
        "readOnly": False,
        "hideSearchBar": False,
    },
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
        'step': 'portal.apps.onboarding.steps.allocation.AllocationStep',
        'settings': {}
    },
    {
        'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
        'settings': {
            # List of TAS project SQL IDs to check membership against for
            # portal access. Only one is required.
            'project_sql_id': [12345, 66858],

            # TAS project SQL Id to set as the default project for users in
            # this portal if user does not have membership in any project in
            # the project_sql_id list.
            'default_project_sql_id': 66858,

            # Defaults to 'Accounting' if left blank
            'rt_queue': _RT_QUEUE
        }
    },
    {
        'step': 'portal.apps.onboarding.steps.system_access.SystemAccessStep',
        'settings': {
            'required_systems': ['stampede2.tacc.utexas.edu','ls5.tacc.utexas.edu'],
            'project_sql_id': 12345,
            'rt_queue': _RT_QUEUE     # Defaults to 'Accounting' if left blank
        }
    },
    {
        'step': 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
        'settings': {
            'access_systems': ['cloud.data', 'frontera', 'stampede2.community'],  # Tapis systems to grant file access
            'credentials_systems': ['cloud.data']  # Tapis systems to grant user credentials with TMS
        }
    },
]
"""

_PORTAL_USER_ACCOUNT_SETUP_STEPS = [
    {"step": "portal.apps.onboarding.steps.allocation.AllocationStep", "settings": {}},
    {
        "step": "portal.apps.onboarding.steps.project_membership.ProjectMembershipStep",
        "settings": {
            # `project_sql_id`:
            #       List of TAS project SQL IDs to check membership against for
            #       portal access. Only one is required.
            "project_sql_id": [9192, 66858],
            # `default_project_sql_id`:
            #       The TAS project SQL Id to set upon approval as the default project
            #       for users in this portal if user does not have membership in any
            #       project in the project_sql_id list.
            "default_project_sql_id": 66858,  # 66858 is the TACC-ACI-DEMO project SQL ID
            # `rt_queue`:
            #       Defaults to 'Accounting' if left blank
            "rt_queue": _RT_QUEUE,
        },
    },
    {
        "step": "portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3",
        "settings": {"credentials_systems": ["cloud.data"]},
    },
]

#######################
# PROJECTS SETTINGS
#######################

_PORTAL_PROJECTS_SYSTEM_PREFIX = "cep.project"
_PORTAL_PROJECTS_ID_PREFIX = "CEP"
_PORTAL_PROJECTS_ROOT_DIR = "/corral-repl/tacc/aci/CEP/projects"
_PORTAL_PROJECTS_ROOT_SYSTEM_NAME = "cep.project.root"
_PORTAL_PROJECTS_ROOT_HOST = "cloud.data.tacc.utexas.edu"
_PORTAL_PROJECTS_SYSTEM_PORT = "22"
_PORTAL_PROJECTS_PEMS_APP_ID = ""  # Defunct in v3
_PORTAL_PROJECTS_USE_SET_FACL_JOB = True

########################
# Custom Portal Template Assets
# Asset path root is static files output dir.
# {% static %} won't work in conjunction with {{ VARIABLE }} so use full paths.
########################

# No Art.
# _PORTAL_ICON_FILENAME=''                 # Empty string yields NO icon.

# Default Art.
_PORTAL_ICON_FILENAME = "/static/site_cms/img/favicons/favicon.ico"

########################
# GOOGLE ANALYTICS
########################

# Using test account under personal email.
# To use during dev, Tracking Protection in browser needs to be turned OFF.
# Need to setup an admin account to aggregate tracking properties for portals.
# NOTE: Use the _TAPIS_TENANT_BASEURL URL value when setting up the tracking property.
_GOOGLE_ANALYTICS_PROPERTY_ID = "UA-114289987-X"

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
    "compressApp": {
        "id": "compress",
        "version": "0.0.4",  # Can be set to "" to use the latest version
    },
    "extractApp": {
        "id": "extract",
        "version": "0.0.1",  # Can be set to "" to use the latest version
    },
    "makePublic": True,
    "hideApps": False,
    "hideDataFiles": False,
    "showSubmissions": False,
    "hideAllocations": False,
    "hideManageAccount": False,
    "hideSystemStatus": False,
    "hasUserGuide": True,
    "onboardingCompleteRedirect": "/workbench/",
    "noPHISystem": "",
    "customDashboardSection": None,
    "ticketAttachmentMaxSizeMessage": "Max File Size: 3MB",
    "ticketAttachmentMaxSize": 3145728,
    "jobsv2Title": "Historic Jobs",
}

_PORTAL_ELEVATED_ROLES = {
    "is_staff": {"groups": ["TACC-ACI"], "usernames": []},
    "is_superuser": {"groups": ["TACC-ACI"], "usernames": []},
}

##################################
# PORTAL INTERNAL DOCS SETTINGS
##################################
_INTERNAL_DOCS_URL = "core/internal-docs/"
