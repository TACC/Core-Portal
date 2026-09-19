import React from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from '_common';
import { formatLabel } from 'utils/formatLabel';
import styles from './MetadataTitle.module.scss';

// Listing header for a metadata entity: its name + a data_type badge, with an
// optional `actions` slot (e.g. an edit button). Falls back to the project title.
const MetadataTitle = ({ folderMetadata, metadata, loading, actions }) => {
  if (loading) {
    return <LoadingSpinner placement="inline" />;
  }

  if (folderMetadata && folderMetadata.data_type) {
    return (
      <>
        {folderMetadata.name}
        <span className={styles['dataTypeBox']}>
          {formatLabel(folderMetadata.data_type)}
        </span>
        {actions}
      </>
    );
  }

  return metadata.title;
};

MetadataTitle.propTypes = {
  folderMetadata: PropTypes.shape({}),
  metadata: PropTypes.object,
  loading: PropTypes.bool,
  actions: PropTypes.node,
};

export default MetadataTitle;
