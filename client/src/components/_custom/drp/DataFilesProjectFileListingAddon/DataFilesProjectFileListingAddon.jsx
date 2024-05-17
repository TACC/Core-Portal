import React, { useEffect, useState } from 'react';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DataFilesProjectFileListingAddon.module.scss';
import { useSelectedFiles } from 'hooks/datafiles';
import useDrpDatasetModals from '../utils/hooks/useDrpDatasetModals';

const DataFilesProjectFileListingAddon = () => {
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);
  const { selectedFiles } = useSelectedFiles();

  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } = useDrpDatasetModals(projectId, portalName);

  return (
    <>
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata &&
        selectedFiles[0].metadata['data_type'] === 'sample' ? (
          <Button
            type="link"
            onClick={() => createSampleModal('EDIT_SAMPLE_DATA', selectedFiles[0])}
          >
            Edit Sample Data
          </Button>
        ) : (
          <Button type="link" onClick={() => createSampleModal('ADD_SAMPLE_DATA')}>
            Add Sample Data
          </Button>
        )}
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata &&
        selectedFiles[0].metadata['data_type'] === 'origin_data' ? (
          <Button
            type="link"
            onClick={() =>
              createOriginDataModal('EDIT_ORIGIN_DATASET', selectedFiles[0])
            }
          >
            Edit Origin Dataset
          </Button>
        ) : (
          <Button
            type="link"
            onClick={() => createOriginDataModal('ADD_ORIGIN_DATASET')}
          >
            Add Origin Dataset
          </Button>
        )}
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata &&
        selectedFiles[0].metadata['data_type'] === 'analysis_data' ? (
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
  );
};

export default DataFilesProjectFileListingAddon;
