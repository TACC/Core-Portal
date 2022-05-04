########################
# DJANGO SETTINGS
########################

SECRET_KEY = 'replacethiswithareallysecureandcomplexsecretkeystring'
DEBUG = False

ALLOWED_HOSTS = ['0.0.0.0', '127.0.0.1', 'localhost', '*']

LDAP_ENABLED = False

########################
# DATABASE SETTINGS
########################

DATABASES = {
   'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'PORT': '5432',
        'NAME': 'taccsite',
        'USER': 'postgresadmin',
        'PASSWORD': 'taccforever',  # Change before live deployment.
        'HOST': 'core_cms_postgres'
    }
}

########################
# GOOGLE ANALYTICS
########################

GOOGLE_ANALYTICS_PROPERTY_ID = 'UA-123ABC@%$&-#'
GOOGLE_ANALYTICS_PRELOAD = True

########################
# ELASTICSEARCH
########################

ES_AUTH = 'username:password'
ES_HOSTS = 'http://elasticsearch:9200'
ES_INDEX_PREFIX = 'cms-dev-{}'
ES_DOMAIN = 'http://localhost:8000'
