"""DRP schema extension."""

from portal.apps._custom.drp.models import (
    DrpAnalysisDatasetMetadata,
    DrpFileMetadata,
    DrpOriginDatasetMetadata,
    DrpProjectMetadata,
    DrpSampleMetadata,
)
from portal.apps.projects.schema_models import constants

SCHEMA_MAPPING = {
    constants.PROJECT: DrpProjectMetadata,
    constants.SAMPLE: DrpSampleMetadata,
    constants.ORIGIN_DATA: DrpOriginDatasetMetadata,
    constants.DIGITAL_DATASET: DrpOriginDatasetMetadata,
    constants.ANALYSIS_DATA: DrpAnalysisDatasetMetadata,
    constants.FILE: DrpFileMetadata,
}
