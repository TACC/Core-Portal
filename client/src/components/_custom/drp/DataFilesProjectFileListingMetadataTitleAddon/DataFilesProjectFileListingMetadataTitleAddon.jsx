import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Button } from '_common';
import { useFileListing } from 'hooks/datafiles';
import { MetadataTitle } from '_common/ProjectMetadata';
import useDrpDatasetModals from '../utils/hooks/useDrpDatasetModals';

const DataFilesProjectFileListingMetadataTitleAddon = ({
  folderMetadata,
  metadata,
  system,
  path,
}) => {
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);
  const { loading } = useFileListing('FilesListing');

  const { canEditDataset } = useSelector((state) => {
    const userAccess = state.projects.metadata.members
      .filter((member) =>
        member.user
          ? member.user.username === state.authenticatedUser?.user?.username
          : { access: null }
      )
      .map((currentUser) => {
        return {
          canEditDataset:
            currentUser.access === 'owner' || currentUser.access === 'edit',
        };
      })[0];

    return userAccess || { canEditDataset: false };
  });

  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } =
    useDrpDatasetModals(projectId, portalName);

  const onEditData = (dataType) => {
    const name = path.split('/').pop();
    // reconstruct editFile to mimic SelectedFile object
    const editFile = {
      format: 'folder',
      id: system + '/' + path,
      metadata: folderMetadata,
      name: name,
      system: system,
      path: path,
      type: 'dir',
      _links: {
        self: {
          href: 'tapis://' + system + '/' + path,
        },
      },
    };
    switch (dataType) {
      case 'sample':
        createSampleModal('EDIT_SAMPLE_DATA', editFile);
        break;
      case 'digital_dataset':
        createOriginDataModal('EDIT_ORIGIN_DATASET', editFile);
        break;
      case 'analysis_data':
        createAnalysisDataModal('EDIT_ANALYSIS_DATASET', editFile);
        break;
      default:
        break;
    }
  };

  const actions = canEditDataset ? (
    <Button type="link" onClick={() => onEditData(folderMetadata.data_type)}>
      Edit Data
    </Button>
  ) : null;

  return (
    <MetadataTitle
      folderMetadata={folderMetadata}
      metadata={metadata}
      loading={loading}
      actions={actions}
    />
  );
};

DataFilesProjectFileListingMetadataTitleAddon.propTypes = {
  folderMetadata: PropTypes.shape({}),
  metadata: PropTypes.object,
  system: PropTypes.string,
  path: PropTypes.string,
};

export default DataFilesProjectFileListingMetadataTitleAddon;
