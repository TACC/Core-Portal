
########################
# DJANGO SETTINGS
########################

_SECRET_KEY = 'change_me'
_DEBUG = True
_ALLOWED_HOSTS = ['0.0.0.0', '127.0.0.1', 'localhost', '*']

# As needed:
_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION': 'frontera_prtl_memcached:11211',
    }
}

########################
# DATABASE SETTINGS
########################

_DATABASE_ENGINE = 'django.db.backends.postgresql'
_DATABASE_NAME = 'dev'
_DATABASE_USERNAME = 'dev'
_DATABASE_PASSWORD = 'dev'
_DATABASE_HOST = 'frontera_cms_postgres'
_DATABASE_PORT = 5432

########################
# DJANGO CMS SETTINGS
########################

# CMS Site (allows for multiple sites on a single CMS)
_SITE_ID = 1
_CMS_TEMPLATES = (
    # Customize this
    ('fullwidth.html', 'Fullwidth'),
    ('sidebar_left.html', 'Sidebar Left'),
    ('sidebar_right.html', 'Sidebar Right')
)

########################
# GOOGLE ANALYTICS
########################

# To use during dev, Tracking Protection in browser needs to be turned OFF.
_GOOGLE_ANALYTICS_PROPERTY_ID = ''
_GOOGLE_ANALYTICS_PRELOAD = ''

########################
# CUSTOM SITE SETTINGS
########################

_DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY = ""
_DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY = ""

########################
# BRANDING.

_TACC_BRANDING = [
    "tacc",
    "site_cms/images/org_logos/tacc-white.png",
    "branding-tacc",
    "https://www.tacc.utexas.edu/",
    "_blank",
    "TACC Logo",
    "anonymous",
    "True"
]

_UTEXAS_BRANDING = [
    "utexas",
    "site_cms/images/org_logos/utaustin-white.png",
    "branding-utaustin",
    "https://www.utexas.edu/",
    "_blank",
    "University of Texas at Austin Logo",
    "anonymous",
    "True"
]

_BRANDING = [_TACC_BRANDING, _UTEXAS_BRANDING]

########################
# LOGOS.

_FRONTERA_LOGO = [
    "frontera",
    "site_cms/images/org_logos/frontera-white-solo.png",
    "",
    "/",
    "_self",
    "Frontera Logo",
    "anonymous",
    "True"
]

_LOGO = _FRONTERA_LOGO
