import React from 'react';
import PropTypes from 'prop-types';
import { useFileListing } from 'hooks/datafiles';
import { MetadataTitle } from '_common/ProjectMetadata';

// Default listing header for a metadata entity.
const DataFilesProjectFileListingMetadataTitleAddon = ({
  folderMetadata,
  metadata,
}) => {
  const { loading } = useFileListing('FilesListing');

  return (
    <MetadataTitle
      folderMetadata={folderMetadata}
      metadata={metadata}
      loading={loading}
    />
  );
};

DataFilesProjectFileListingMetadataTitleAddon.propTypes = {
  folderMetadata: PropTypes.shape({}),
  metadata: PropTypes.object,
};

export default DataFilesProjectFileListingMetadataTitleAddon;
