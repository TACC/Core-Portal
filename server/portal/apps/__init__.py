import importlib
from django.conf import settings
from portal.apps.projects.schema_models import constants
from portal.apps.projects.schema_models.base_metadata import (
    BaseProjectMetadata,
    BaseFileMetadata,
    PartialTrashEntity,
)

SCHEMA_MAPPING = {
    constants.PROJECT: BaseProjectMetadata,
    constants.FILE: BaseFileMetadata,
    constants.TRASH: PartialTrashEntity,
}

# Merge the active portal's schema extension (domain entity types + overrides).
try:
    _portal_schema = importlib.import_module(
        f"portal.apps._custom.{settings.PORTAL_NAMESPACE.lower()}.schema"
    )
    SCHEMA_MAPPING.update(_portal_schema.SCHEMA_MAPPING)
except ModuleNotFoundError:
    pass
