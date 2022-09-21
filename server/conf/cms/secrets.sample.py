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
ES_INDEX_PREFIX = 'cep-dev-{}'
ES_DOMAIN = 'http://localhost:8000'

es_engine = 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine'
HAYSTACK_CONNECTIONS = {
  'default': {
    'ENGINE': es_engine,
    'URL': ES_HOSTS,
    'INDEX_NAME': ES_INDEX_PREFIX.format('cms'),
    'KWARGS': {'http_auth': ES_AUTH}
  }
}

SILENCED_SYSTEM_CHECKS = ['captcha.recaptcha_test_key_error']
