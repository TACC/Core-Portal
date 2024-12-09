########################
# DJANGO
########################

SECRET_KEY = 'replacethiswithareallysecureandcomplexsecretkeystring'
LOGIN_REDIRECT_URL = '/workbench/dashboard/'

########################
# SEARCH
########################

ES_AUTH = 'username:password'
ES_HOSTS = 'http://elasticsearch:9200'
ES_INDEX_PREFIX = 'cep-dev-{}'
ES_DOMAIN = 'https://cep.test'

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': ES_HOSTS,
        'INDEX_NAME': ES_INDEX_PREFIX.format('cms'),
        'KWARGS': {'http_auth': ES_AUTH}
    }
}

########################
# REDMINE TRACKER AUTH
########################

RT_HOST = ''
RT_UN = ''
RT_PW = ''
RT_QUEUE = ''
RT_TAG = ''
