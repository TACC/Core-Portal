import React from 'react';
import PropTypes from 'prop-types';
import { useFileListing } from 'hooks/datafiles';
import { ProjectMetadataView } from '_common/ProjectMetadata';

// Default project/folder metadata addon.
const DataFilesProjectFileListingMetadataAddon = (props) => {
  const { loading } = useFileListing('FilesListing');

  if (loading) {
    return null;
  }

  return <ProjectMetadataView {...props} />;
};

DataFilesProjectFileListingMetadataAddon.propTypes = {
  folderMetadata: PropTypes.shape({}),
};

export default DataFilesProjectFileListingMetadataAddon;
