########################
# DJANGO
########################

CSRF_TRUSTED_ORIGINS = ["https://cep.test"]

LOGIN_REDIRECT_URL = '/workbench/dashboard/'

SILENCED_SYSTEM_CHECKS = ['captcha.recaptcha_test_key_error']

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
