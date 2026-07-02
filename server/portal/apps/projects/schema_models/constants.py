"""Portal-resolved metadata entity-type name constants."""

import importlib

from django.conf import settings

# Base entity names (default values; portals may override)
PROJECT = "project"
PROJECT_GRAPH = "project.graph"
FILE = "project.file"
TRASH = "project.trash"

# Override with portal-specific constants
try:
    _portal_constants = importlib.import_module(
        f"portal.apps._custom.{settings.PORTAL_NAMESPACE.lower()}.constants"
    )
    for _name in dir(_portal_constants):
        if _name.isupper() and not _name.startswith("_"):
            globals()[_name] = getattr(_portal_constants, _name)
except ModuleNotFoundError:
    pass
