import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useFileListing } from 'hooks/datafiles';
import { ProjectMetadataView } from '_common/ProjectMetadata';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';

const ENTITY_LINKS = [
  { key: 'digital_dataset', label: 'Digital Dataset' },
  { key: 'sample', label: 'Sample' },
];

const DataFilesProjectFileListingMetadataAddon = (props) => {
  const { system } = props;
  const dispatch = useDispatch();

  const { portalName } = useSelector((state) => state.workbench);
  const { value: tree, error } = useSelector((state) => state.publications.tree);
  const { loading } = useFileListing('FilesListing');

  useEffect(() => {
    if (system && portalName && !error) {
      dispatch({
        type: 'PUBLICATIONS_GET_TREE',
        payload: { portalName, system },
      });
    }
  }, [system, portalName]);

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
