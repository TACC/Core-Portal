import React from 'react';
import PropTypes from 'prop-types';
import { Expand } from '_common';
import MetadataDisplay from '../MetadataDisplay/MetadataDisplay';

// Collapsible metadata section: renders MetadataDisplay
const MetadataPreview = ({ metadata, excludeKeys = [] }) => {
  if (!metadata) {
    return null;
  }

  const hasVisibleMetadata = Object.entries(metadata).some(
    ([key, value]) =>
      !excludeKeys.includes(key) &&
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
      message={<MetadataDisplay data={metadata} excludeKeys={excludeKeys} />}
    />
  );
};

MetadataPreview.propTypes = {
  metadata: PropTypes.object,
  excludeKeys: PropTypes.array,
};

export default MetadataPreview;
