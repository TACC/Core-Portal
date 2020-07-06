# FRONTERA CMS REPO TEMPLATE SETTINGS.
# DEFAULT VALUES - CHANGE FOR LIVE USE.

########################
# DJANGO SETTINGS
########################

_SECRET_KEY = 'replacethiswithareallysecureandcomplexsecretkeystring'
_DEBUG = True       # False for Prod.
# Specify allowed hosts or use an asterisk to allow any host and simplify the config.
# _ALLOWED_HOSTS = ['hostname.tacc.utexas.edu', 'host.ip.v4.address', '0.0.0.0', 'localhost', '127.0.0.1']   # In production.
_ALLOWED_HOSTS = ['0.0.0.0', '127.0.0.1', 'localhost', '*']   # In development.

########################
# UNIQUE TO PORTAL CMS

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

_DATABASE_ENGINE = 'django.db.backends.postgresql_psycopg2'
_DATABASE_NAME = 'taccsite'
_DATABASE_USERNAME = 'postgresadmin'
_DATABASE_PASSWORD = 'taccforever'     # Change for live deployment.
_DATABASE_HOST = 'frontera_cms_postgres'
_DATABASE_PORT = '5432'

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
_GOOGLE_ANALYTICS_PROPERTY_ID = "UA-123ABC@%$&-#"
_GOOGLE_ANALYTICS_PRELOAD = True

########################
# CUSTOM SITE SETTINGS
########################

_DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY = ""
_DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY = ""

"""
Additional Branding and Portal Logos for Partner & Affiliate Organizations

Usage:

- For each logo used in the templating, add new settings values (see example below).
- New branding settings must be added to the _BRANDING list.
- The order of the _BRANDING list determines the rendering order of the elements.
- The portal _ANORG_LOGO settings must be assigned to the _LOGO variable.
- The selector styles for new items set in the configuration objects should exist in the portal css.

Values to populate:

_SETTING_NAME = [                 # The name of the branding or logo config setting object.
    "org_name",                         # The name of the organization the branding belongs too.
    "img_file_src",                      # Path and filename relative to the static files folder.
    "img_element_classes",        # The list of selectors to apply to the rendered element, these need to exist in the css/scss.
    "a_target_url",                      # The href link to follow when clicked, use "/" for portal logos.
    "a_target_type",                    # The target to open the new link in, use _blank for external links, _self for internal links.
    "alt_text",                             # The text to read or render for web assistance standards.
    "cors_setting",                      # The CORS setting for the image, set to anonymous by default.
    "visibility"                             # Toggles wether or not to display the element in the template, use True to render, False to hide.
]

Branding Configuration Example.

_ANORG_BRANDING = [
   "anorg",
   "site_cms/images/org_logos/anorg-logo.png"
   "branding-anorg",
   "https://www.anorg.com/"
   "_blank",
   "ANORG Logo",
   "anonymous",
   "True"
]

Logo Configuration Example.

_ANORG_LOGO = [
   "anorg",
   "site_cms/images/org_logos/anorg-logo.png"
   "branding-anorg",
   "/"
   "_self",
   "ANORG Logo",
   "anonymous",
   "True"
]
"""

########################
# BRANDING.

_NSF_BRANDING = [
    "nsf",
    "site_cms/images/org_logos/nsf-white.png",
    "branding-nsf",
    "https://www.nsf.gov/",
    "_blank",
    "NSF Logo",
    "anonymous",
    "True"
]

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

_UHAWAII_BRANDING = [
    "uhawaii",
    "site_cms/images/org_logos/hawaii-header-trimmed.png",
    "branding-uhawaii",
    "https://www.hawaii.edu/",
    "_blank",
    "University of Hawaii Logo",
    "anonymous",
    "True"
]

_BRANDING = [_TACC_BRANDING, _UTEXAS_BRANDING]        # Default TACC Portal.
# _BRANDING = [ _NSF_BRANDING, _TACC_BRANDING, _UTEXAS_BRANDING ]       # NSF Funded TACC Portal.
# _BRANDING = [ _TACC_BRANDING, _UTEXAS_BRANDING, _UHAWAII_BRANDING ]        # TACC Portal w/ Specific Partners.
# _BRANDING = [ _NSF_BRANDING, _TACC_BRANDING, _UTEXAS_BRANDING, _UHAWAII_BRANDING ]        # NSF Funded Portal w/ Specific Partners.

########################
# LOGOS.

_PORTAL_LOGO = [
    "portal",
    "site_cms/images/portal.png",
    "",
    "/",
    "_self",
    "Portal Logo",
    "anonymous",
    "True"
]

_LCCF_LOGO = [
    "lccf",
    "site_cms/images/org_logos/lccf-white.png",
    "",
    "/",
    "_self",
    "LCCF Logo",
    "anonymous",
    "True"
]

_TAPISIO_LOGO = [
    "tapisio",
    "site_cms/images/org_logos/tapis-logo-navbar.png",
    "",
    "/",
    "_self",
    "Tapis IO Logo",
    "anonymous",
    "True"
]

_TEXASCALE_LOGO = [
    "texascale",
    "site_cms/images/org_logos/texascale-wordmark.png",
    "",
    "/",
    "_self",
    "Texascale Logo",
    "anonymous",
    "True"
]

_LOGO = _PORTAL_LOGO                # Default Portal Logo.
# _LOGO = _LCCF_LOGO
# _LOGO = _TAPISIO_LOGO
# _LOGO = _TEXASCALE_LOGO
