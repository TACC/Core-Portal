
## Common Customizations
_SECRET_KEY = 'change me'
_DEBUG = True

# elastic search
ES_INDEX_PREFIX = 'frontera-staging-{}'
ES_HOSTS = 'frontera_prtl_elasticsearch:9200'

AGAVE_STORAGE_SYSTEM = 'frontera.storage.default'
AGAVE_COMMUNITY_DATA_SYSTEM = 'frontera.storage.community'
AGAVE_PUBLIC_DATA_SYSTEM = 'frontera.storage.public'
PORTAL_ADMIN_USERNAME = 'wma_prtl'

BROKER_URL_PROTOCOL = 'amqp://'
BROKER_URL_USERNAME = 'dev'
BROKER_URL_PWD = 'dev'
BROKER_URL_HOST = 'frontera_prtl_rabbitmq'
BROKER_URL_PORT = '5672'
BROKER_URL_VHOST = 'dev'

CELERY_BROKER_URL = ''.join(
    [
        BROKER_URL_PROTOCOL, BROKER_URL_USERNAME, ':',
        BROKER_URL_PWD, '@', BROKER_URL_HOST, ':',
        BROKER_URL_PORT, '/', BROKER_URL_VHOST
    ]
)

RESULT_BACKEND_PROTOCOL = 'redis://'
RESULT_BACKEND_USERNAME = 'dev'
RESULT_BACKEND_PWD = 'dev'
RESULT_BACKEND_HOST = 'frontera_prtl_redis'
RESULT_BACKEND_PORT = '6379'
RESULT_BACKEND_DB = '0'

CELERY_RESULT_BACKEND = ''.join(
    [
        RESULT_BACKEND_PROTOCOL,
        RESULT_BACKEND_HOST, ':', RESULT_BACKEND_PORT,
        '/', RESULT_BACKEND_DB
    ]
)

PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX = 'frontera.home.{}'
PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_ABS_PATH = '/corral-repl/tacc/aci/CEP/home_dirs/'
PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_REL_PATH = 'home_dirs'
PORTAL_DATA_DEPOT_STORAGE_HOST = 'frontera.tacc.utexas.edu'
PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX = 'frontera.project'
PORTAL_PROJECTS_NAME_PREFIX = 'frontera.project'
PORTAL_NAMESPACE = 'frontera'
PORTAL_PROJECTS_ID_PREFIX = lambda PORTAL_NAMESPACE : PORTAL_NAMESPACE.upper()
PORTAL_PROJECTS_ROOT_DIR = 'data.tacc.utexas.edu'
PORTAL_PROJECTS_ROOT_SYSTEM_NAME = lambda PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX : '{}.root'.format(PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX)
PORTAL_PROJECTS_ROOT_HOST = 'data.tacc.utexas.edu'
PORTAL_PROJECTS_PRIVATE_KEY = ''
PORTAL_PROJECTS_PUBLIC_KEY = ''
PORTAL_DATA_DEPOT_WORK_HOME_DIR_EXEC_SYSTEM = 'frontera'
PORTAL_APPS_METADATA_NAMES = ["portal_apps", "test_apps", "utrc_apps"]
PORTAL_DOMAIN = 'cep.dev'
PORTAL_ALLOCATION = 'TACC-ACI'


#################################### Secret Properties List ####################################

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'dev',
        'USER': 'dev',
        'PASSWORD': 'dev',
        'HOST': 'frontera_prtl_postgres',
        'PORT': '5432'
    }
}

# Agave Client Configuration
AGAVE_CLIENT_KEY = ''
AGAVE_CLIENT_SECRET = ''
AGAVE_SUPER_TOKEN = ''

PORTAL_PROJECTS_PUBLIC_KEY = 'ssh-rsa ...'
PORTAL_PROJECTS_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----"
PORTAL_USER_ACCOUNT_SETUP_WEBHOOK_PWD = ''

#tas credentials
TAS_CLIENT_KEY = ''
TAS_CLIENT_SECRET = ''

# redmine tracker auth
RT_UN = ''
RT_PW = r''
RT_QUEUE = 'Frontera'
RT_TAG = 'frontera_portal'


RECAPTCHA_PUBLIC_KEY = ''
RECAPTCHA_PRIVATE_KEY = ''

EXTERNAL_RESOURCE_SECRETS = {
    "google-drive": {
        "client_secret": "",
        "client_id": "",
        "name": "Google Drive",
        "directory": "external-resources"
    }
}

# elastic searchauth
ES_AUTH = 'dev:esauth'
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': ES_HOSTS,
        'INDEX_NAME': ES_INDEX_PREFIX.format('cms'),
        'KWARGS': {'http_auth': ES_AUTH}
    }
}