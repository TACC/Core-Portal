
from portal.apps._custom.drp.models import DrpProjectMetadata, DrpSampleMetadata, DrpOriginDatasetMetadata, DrpAnalysisDatasetMetadata, DrpFileMetadata, PartialTrashEntity
from portal.apps._custom.drp import constants

SCHEMA_MAPPING = {
    constants.PROJECT: DrpProjectMetadata,
    constants.SAMPLE: DrpSampleMetadata,
    constants.ORIGIN_DATA: DrpOriginDatasetMetadata,
    constants.DIGITAL_DATASET: DrpOriginDatasetMetadata,
    constants.ANALYSIS_DATA: DrpAnalysisDatasetMetadata,
    constants.FILE: DrpFileMetadata,
    constants.TRASH: PartialTrashEntity,
}