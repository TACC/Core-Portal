import React from 'react';
import PropTypes from 'prop-types';
import { useFileListing, useProjectTree } from 'hooks/datafiles';
import { ProjectMetadataView } from '_common/ProjectMetadata';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';

const ENTITY_LINKS = [
  { key: 'digital_dataset', label: 'Digital Dataset' },
  { key: 'sample', label: 'Sample' },
];

const DataFilesProjectFileListingMetadataAddon = (props) => {
  const { system } = props;
  const { data } = useProjectTree(system);
  const tree = data?.[0];
  const { loading } = useFileListing('FilesListing');

  if (loading || !tree) {
    return null;
  }

  return (
    <ProjectMetadataView
      {...props}
      tree={tree}
      entityLinks={ENTITY_LINKS}
      excludeKeys={EXCLUDED_METADATA_FIELDS}
    />
  );
};

DataFilesProjectFileListingMetadataAddon.propTypes = {
  folderMetadata: PropTypes.shape({}),
  system: PropTypes.string,
};

export default DataFilesProjectFileListingMetadataAddon;
