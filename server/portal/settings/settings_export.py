"""Settings exposed to templates as `{{ settings.* }}` by django_settings_export.

Shared by settings.py and unit_test_settings.py, so the tests render templates with the same
settings the portal does.
"""

SETTINGS_EXPORT = [
    "PORTAL_ICON_FILENAME",
    "PORTAL_CSS_FILENAMES",
    "DEBUG",
    "GOOGLE_ANALYTICS_PROPERTY_ID",
    "PORTAL_NAMESPACE",
    "WORKBENCH_SETTINGS",
    "DOCS_CHATBOT_URL",
    "PORTAL_USER_ACCOUNT_SETUP_STEPS",
    "PORTAL_NOINDEX_APP_SHELL",
]
