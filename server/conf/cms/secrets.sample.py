########################
# DJANGO SETTINGS
########################

SECRET_KEY = 'replacethiswithareallysecureandcomplexsecretkeystring'
LOGIN_REDIRECT_URL = '/workbench/dashboard/'

########################
# ELASTICSEARCH
########################

ES_AUTH = 'username:password'
ES_HOSTS = 'http://elasticsearch:9200'
ES_INDEX_PREFIX = 'cep-dev-{}'
ES_DOMAIN = 'https://cep.test'

es_engine = 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine'
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': es_engine,
        'URL': ES_HOSTS,
        'INDEX_NAME': ES_INDEX_PREFIX.format('cms'),
        'KWARGS': {'http_auth': ES_AUTH}
    }
}

########################
# RECAPTCHA SETTINGS
########################

RECAPTCHA_PUBLIC_KEY = ''
RECAPTCHA_PRIVATE_KEY = ''
SILENCED_SYSTEM_CHECKS = ['captcha.recaptcha_test_key_error']

########################
# REDMINE TRACKER AUTH
########################

RT_HOST = ''
RT_UN = ''
RT_PW = ''
RT_QUEUE = ''
RT_TAG = ''
