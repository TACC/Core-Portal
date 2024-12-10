import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataTitleAddon.module.scss';
import { Button, LoadingSpinner } from '_common';
import { fetchUtil } from 'utils/fetchUtil';
import { useFileListing } from 'hooks/datafiles';
import useDrpDatasetModals from '../utils/hooks/useDrpDatasetModals';

const DataFilesProjectFileListingMetadataTitleAddon = ({
  folderMetadata,
  metadata,
  system,
  path,
}) => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);

  const { loading } = useFileListing('FilesListing');

  const { canEditDataset } = useSelector((state) => {
    const userAccess = state.projects.metadata.members
      .filter((member) =>
        member.user
          ? member.user.username === state.authenticatedUser.user.username
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

  // Function to format the data_type value from snake_case to Label Case i.e. origin_data -> Origin Data
  const formatDatatype = (data_type) =>
    data_type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <>
      {loading ? (
        <LoadingSpinner placement="inline" />
      ) : folderMetadata && folderMetadata.data_type ? (
        <>
          {folderMetadata.name}
          <span className={styles['dataTypeBox']}>
            {formatDatatype(folderMetadata.data_type)}
          </span>
          {canEditDataset && (
            <Button
              type="link"
              onClick={() => onEditData(folderMetadata.data_type)}
            >
              Edit Data
            </Button>
          )}
        </>
      ) : (
        metadata.title
      )}
    </>
  );
};

DataFilesProjectFileListingMetadataTitleAddon.propTypes = {
  folderMetadata: PropTypes.shape({}).isRequired,
};

export default DataFilesProjectFileListingMetadataTitleAddon;
