"""DRP schema extension."""

from portal.apps.projects.schema_models import constants
from portal.apps._custom.drp.models import (
    DrpProjectMetadata,
    DrpSampleMetadata,
    DrpOriginDatasetMetadata,
    DrpAnalysisDatasetMetadata,
    DrpFileMetadata,
)
from portal.apps.projects.schema_models.base_metadata import PartialTrashEntity

SCHEMA_MAPPING = {
    constants.PROJECT: DrpProjectMetadata,
    constants.SAMPLE: DrpSampleMetadata,
    constants.ORIGIN_DATA: DrpOriginDatasetMetadata,
    constants.DIGITAL_DATASET: DrpOriginDatasetMetadata,
    constants.ANALYSIS_DATA: DrpAnalysisDatasetMetadata,
    constants.FILE: DrpFileMetadata,
    constants.TRASH: PartialTrashEntity,
}
