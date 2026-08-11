import React from 'react';
import PropTypes from 'prop-types';
import { Expand } from '_common';
import DataDisplay from '../utils/DataDisplay/DataDisplay';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';

const HIDDEN_FIELDS = [...EXCLUDED_METADATA_FIELDS, 'is_advanced_image_file'];

const DataFilesPreviewModalAddon = ({ metadata }) => {
  if (!metadata) {
    return null;
  }

  // Only render if there is at least one visible, non-empty metadata field
  const hasVisibleMetadata = Object.entries(metadata).some(
    ([key, value]) =>
      !HIDDEN_FIELDS.includes(key) &&
      value !== '' &&
      value !== null &&
      value !== undefined
  );

  if (!hasVisibleMetadata) {
    return null;
  }

  return (
    <Expand
      detail="Metadata"
      isOpenDefault={false}
      message={<DataDisplay data={metadata} excludeKeys={HIDDEN_FIELDS} />}
    />
  );
};

DataFilesPreviewModalAddon.propTypes = {
  metadata: PropTypes.object,
};

export default DataFilesPreviewModalAddon;
