_SECRET_KEY = 'change_me'
_DEBUG = True
_ALLOWED_HOSTS = ['*']
_SITE_ID = 1
_CMS_TEMPLATES = (
    ('base.html', 'Base'),
    ('cms_menu.html', 'CMS Menu'),
    ('fullwidth.html', 'Fullwidth'),
    ('sidebar_left.html', 'Sidebar Left'),
    ('sidebar_right.html', 'Sidebar Right')
)

# As needed:
_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION': 'frontera_prtl_memcached:11211',
    }
}

_NAVIGATION_TEMPLATE = ''

_GOOGLE_ANALYTICS_PROPERTY_ID = ''
_GOOGLE_ANALYTICS_PRELOAD = ''

_DATABASE_ENGINE = 'django.db.backends.postgresql'
_DATABASE_NAME = 'dev'
_DATABASE_USERNAME = 'dev'
_DATABASE_PASSWORD = 'dev'
_DATABASE_HOST = 'frontera_cms_postgres'
_DATABASE_PORT = 5432
