import React from 'react';
import { Button } from '_common';
import { useSelector } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';
import { ProjectFileListingActions } from '_common/ProjectMetadata';
import useDrpDatasetModals from '../utils/hooks/useDrpDatasetModals';
import styles from './DataFilesProjectFileListingAddon.module.scss';

// DRP's toolbar = the generic core publication toolbar + per-entity dataset
// add/edit actions (sample / digital dataset / analysis data) in the slot.
const DataFilesProjectFileListingAddon = ({ rootSystem, system }) => {
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);
  const { selectedFiles } = useSelectedFiles();

  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } =
    useDrpDatasetModals(projectId, portalName);

  const canEditDataset = useSelector((state) => {
    const { members } = state.projects.metadata;
    const { username } = state.authenticatedUser?.user ?? {};
    const currentUser = members.find(
      (member) => member.user?.username === username
    );
    const access = currentUser?.access;
    return access === 'owner' || access === 'edit';
  });

  // The currently selected entity's data_type, when a single one is selected.
  const selectedDataType =
    selectedFiles.length === 1 && selectedFiles[0]?.metadata
      ? selectedFiles[0].metadata['data_type']
      : null;

  const datasetActions = canEditDataset ? (
    <>
      {selectedDataType === 'sample' ? (
        <Button
          type="link"
          onClick={() =>
            createSampleModal('EDIT_SAMPLE_DATA', selectedFiles[0])
          }
        >
          Edit Sample Data
        </Button>
      ) : (
        <Button
          type="link"
          onClick={() => createSampleModal('ADD_SAMPLE_DATA')}
        >
          Add Sample Information
        </Button>
      )}
      <span className={styles.separator}>|</span>
      {selectedDataType === 'digital_dataset' ? (
        <Button
          type="link"
          onClick={() =>
            createOriginDataModal('EDIT_ORIGIN_DATASET', selectedFiles[0])
          }
        >
          Edit Digital Dataset
        </Button>
      ) : (
        <Button
          type="link"
          onClick={() => createOriginDataModal('ADD_ORIGIN_DATASET')}
        >
          Add Digital Dataset
        </Button>
      )}
      <span className={styles.separator}>|</span>
      {selectedDataType === 'analysis_data' ? (
        <Button
          type="link"
          onClick={() =>
            createAnalysisDataModal('EDIT_ANALYSIS_DATASET', selectedFiles[0])
          }
        >
          Edit Analysis Dataset
        </Button>
      ) : (
        <Button
          type="link"
          onClick={() => createAnalysisDataModal('ADD_ANALYSIS_DATASET')}
        >
          Add Analysis Dataset
        </Button>
      )}
    </>
  ) : null;

  return (
    <ProjectFileListingActions
      rootSystem={rootSystem}
      system={system}
      datasetActions={datasetActions}
    />
  );
};

export default DataFilesProjectFileListingAddon;
