
from portal.apps._custom.drp.models import DrpProjectMetadata, DrpSampleMetadata, DrpOriginDatasetMetadata, DrpAnalysisDatasetMetadata


SCHEMA_MAPPING = {
    'DRP': {
        'project': DrpProjectMetadata,
        'sample': DrpSampleMetadata,
        'origin_data': DrpOriginDatasetMetadata,
        'analysis_data': DrpAnalysisDatasetMetadata
    }
}