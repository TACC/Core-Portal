# TACC CMS SITE TEMPLATE SETTINGS.
# DEFAULT VALUES - CHANGE FOR LIVE USE.

########################
# DJANGO SETTINGS
########################

_SECRET_KEY = 'replacethiswithareallysecureandcomplexsecretkeystring'
_DEBUG = True       # False for Prod.
_CONSOLE_LOG_ENABLED = False    # Boolean check to turn on/off console logging statements.

# Specify allowed hosts or use an asterisk to allow any host and simplify the config.
# _ALLOWED_HOSTS = ['hostname.tacc.utexas.edu', 'host.ip.v4.address', '0.0.0.0', 'localhost', '127.0.0.1']   # In production.
_ALLOWED_HOSTS = ['0.0.0.0', '127.0.0.1', 'localhost', '*']   # In development.

# Boolean check to see if ldap is being used by the site.
# Ensure the django-auth-ldap==2.0.0 package is uncommented
# in the requirements.txt file or installed if using ldap.
_LDAP_ENABLED = True

########################
# DATABASE SETTINGS
########################

_DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'taccsite',
        'USER': 'postgresadmin',
        'PASSWORD': 'taccforever',   # Change for deployment configuration.
        'HOST': 'taccsite_postgres',               # 'localhost' in demo/local-dev/SAD CMS deployments, 'taccsite_postgres' in containerized portal deployments.
        'PORT': '5432',
    }
}

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
_GOOGLE_ANALYTICS_PROPERTY_ID = "UA-125525035-13"
_GOOGLE_ANALYTICS_PRELOAD = True

########################
# CUSTOM SITE SETTINGS
########################

_DJANGOCMS_FORMS_RECAPTCHA_PUBLIC_KEY = ""
_DJANGOCMS_FORMS_RECAPTCHA_SECRET_KEY = ""

########################
# BRANDING & LOGOS
########################

# Branding settings for portal and navigation.

"""
Additional Branding and Portal Logos for Partner & Affiliate Organizations

Usage:

- For each beand used in the templating, add corresponding new settings values to this file  (see example below).
- New branding settings must be added to the _BRANDING list to render in the template.
- The order of the _BRANDING list determines the rendering order of the elements in the template.
- The portal logo setting must be assigned to the _LOGO variable to render in the template.
- The following VALUES for new elements set in the configuration object must exist in the portal css as well:
    - Any new selectors or css styles (add to /taccsite_cms/static/site_cms/styles/exports/branding_logos.css)
    - Image files being references (add to /taccsite_cms/static/site_cms/images/org_logos)

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

_BRANDING = [_TACC_BRANDING, _UTEXAS_BRANDING]        # Default TACC Portal.
# _BRANDING = [ _NSF_BRANDING, _TACC_BRANDING, _UTEXAS_BRANDING ]       # NSF Funded TACC Portal.

########################
# LOGOS.

_PORTAL_LOGO = [
    "frontera",
    "site_cms/images/org_logos/frontera-white-solo.png",
    "",
    "/",
    "_self",
    "Frontera Logo",
    "anonymous",
    "True"
]

_LOGO = _PORTAL_LOGO                # Default Portal Logo.
