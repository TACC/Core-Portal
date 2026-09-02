"""Portal-resolved metadata entity-type name constants."""

import importlib

from django.conf import settings

# Base entity names, namespaced to the portal
PORTAL_NAMESPACE = settings.PORTAL_NAMESPACE.lower()

PROJECT = f"{PORTAL_NAMESPACE}.project"
PROJECT_GRAPH = f"{PORTAL_NAMESPACE}.project.graph"
FILE = f"{PORTAL_NAMESPACE}.project.file"
TRASH = f"{PORTAL_NAMESPACE}.project.trash"

# Override with portal-specific constants (domain entity types, or explicit
# overrides of the names above)
try:
    _portal_constants = importlib.import_module(
        f"portal.apps._custom.{settings.PORTAL_NAMESPACE.lower()}.constants"
    )
    for _name in dir(_portal_constants):
        if _name.isupper() and not _name.startswith("_"):
            globals()[_name] = getattr(_portal_constants, _name)
except ModuleNotFoundError:
    pass
