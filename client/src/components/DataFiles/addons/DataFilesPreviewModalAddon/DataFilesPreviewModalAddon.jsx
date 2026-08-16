import React from 'react';
import PropTypes from 'prop-types';
import { MetadataPreview } from '_common/ProjectMetadata';

// Default preview addon: shows a file's metadata in a collapsible section.
const DataFilesPreviewModalAddon = ({ metadata }) => (
  <MetadataPreview metadata={metadata} />
);

DataFilesPreviewModalAddon.propTypes = {
  metadata: PropTypes.object,
};

export default DataFilesPreviewModalAddon;
