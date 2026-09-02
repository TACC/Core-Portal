"""DRP schema extension."""

from portal.apps.projects.schema_models import constants
from portal.apps._custom.drp.models import (
    DrpProjectMetadata,
    DrpSampleMetadata,
    DrpOriginDatasetMetadata,
    DrpAnalysisDatasetMetadata,
    DrpFileMetadata,
)

SCHEMA_MAPPING = {
    constants.PROJECT: DrpProjectMetadata,
    constants.SAMPLE: DrpSampleMetadata,
    constants.ORIGIN_DATA: DrpOriginDatasetMetadata,
    constants.DIGITAL_DATASET: DrpOriginDatasetMetadata,
    constants.ANALYSIS_DATA: DrpAnalysisDatasetMetadata,
    constants.FILE: DrpFileMetadata,
}
