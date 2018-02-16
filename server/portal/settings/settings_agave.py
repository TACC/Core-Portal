"""
Agave setup.
"""

from portal.settings import settings_secret

# Agave Tenant.
AGAVE_TENANT_ID = settings_secret._AGAVE_TENANT_ID
AGAVE_TENANT_BASEURL = settings_secret._AGAVE_TENANT_BASEURL

# Agave Client Configuration
AGAVE_CLIENT_KEY = settings_secret._AGAVE_CLIENT_KEY
AGAVE_CLIENT_SECRET = settings_secret._AGAVE_CLIENT_SECRET
AGAVE_SUPER_TOKEN = settings_secret._AGAVE_SUPER_TOKEN
AGAVE_STORAGE_SYSTEM = settings_secret._AGAVE_STORAGE_SYSTEM
AGAVE_COMMUNITY_DATA_SYSTEM = settings_secret._AGAVE_COMMUNITY_DATA_SYSTEM
