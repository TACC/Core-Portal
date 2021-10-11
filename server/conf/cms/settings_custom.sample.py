# SEE: https://github.com/TACC/Core-CMS/blob/main/taccsite_cms/settings_custom.example.py
# SEE: https://github.com/TACC/Core-CMS-Resources/blob/main/example-cms/settings_custom.py

########################
# DJANGO CMS SETTINGS
########################

CMS_TEMPLATES = (
    ('fullwidth.html', 'Full Width'),
    ('standard.html', 'Standard'),

    ('home_portal.html', 'Standard Portal Homepage'),

    ('guide.html', 'Guide'),
    ('guides/getting_started.html', 'Guide: Getting Started'),
    ('guides/data_transfer.html', 'Guide: Data Transfer'),
    ('guides/data_transfer.globus.html', 'Guide: Globus Data Transfer'),
    ('guides/portal_technology.html', 'Guide: Portal Technology Stack')
)

########################
# THEME
########################

"""
Optional theming of CMS (certain themes may only affect some elements)
Usage:
- None (standard theme)
- 'has-dark-logo'
"""
THEME = None

########################
# BRANDING
########################

TACC_BRANDING = [
    "tacc",
    "site_cms/img/org_logos/tacc-white.png",
    "branding-tacc",
    "https://www.tacc.utexas.edu/",
    "_blank",
    "TACC Logo",
    "anonymous",
    "True"
]

UTEXAS_BRANDING = [
    "utexas",
    "site_cms/img/org_logos/utaustin-white.png",
    "branding-utaustin",
    "https://www.utexas.edu/",
    "_blank",
    "University of Texas at Austin Logo",
    "anonymous",
    "True"
]

NSF_BRANDING = [
    "nsf",
    "site_cms/img/org_logos/nsf-white.png",
    "branding-nsf",
    "https://www.nsf.gov/",
    "_blank",
    "NSF Logo",
    "anonymous",
    "True"
]

BRANDING = [ TACC_BRANDING, UTEXAS_BRANDING ]

########################
# LOGOS
########################

LOGO = [
    "portal",
    "site_cms/img/org_logos/portal.png",
    "",
    "/",
    "_self",
    "Portal Logo",
    "anonymous",
    "True"
]

FAVICON = {
    "img_file_src": "site_cms/img/favicons/favicon.ico"
}

########################
# PORTAL
########################

INCLUDES_CORE_PORTAL = False
