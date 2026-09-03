import React from 'react';
import PropTypes from 'prop-types';
import { MetadataPreview } from '_common/ProjectMetadata';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';

const DataFilesPreviewModalAddon = ({ metadata }) => (
  <MetadataPreview metadata={metadata} excludeKeys={EXCLUDED_METADATA_FIELDS} />
);

DataFilesPreviewModalAddon.propTypes = {
  metadata: PropTypes.object,
};

export default DataFilesPreviewModalAddon;
