import React, { useEffect } from 'react';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DataFilesProjectFileListingAddon.module.scss';
import { useSelectedFiles } from 'hooks/datafiles';

const DataFilesProjectFileListingAddon = () => {
  const dispatch = useDispatch();

  const onOpenFormModal = (formName, selectedFile) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: { formName, selectedFile },
      },
    });
  };

  const { selectedFiles } = useSelectedFiles();

  return (
    <>
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata['data_type'] === 'sample' ? 
        <Button type="link" onClick={() => onOpenFormModal('EDIT_SAMPLE_DATA', selectedFiles[0])}>
          Edit Sample Data
        </Button>
      :
        <Button type="link" onClick={() => onOpenFormModal('ADD_SAMPLE_DATA')}>
          Add Sample Data
        </Button>
      }
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata['data_type'] === 'origin_data' ?
        <Button type="link" onClick={() => onOpenFormModal('EDIT_ORIGIN_DATASET', selectedFiles[0])}>
          Edit Origin Dataset
        </Button>
      :
        <Button type="link" onClick={() => onOpenFormModal('ADD_ORIGIN_DATASET')}>
          Add Origin Dataset
        </Button>
      }
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata['data_type'] === 'analysis_data' ?
        <Button
          type="link"
          onClick={() => onOpenFormModal('EDIT_ANALYSIS_DATASET', selectedFiles[0])}
        >
          Edit Analysis Dataset
        </Button>
      :
        <Button
          type="link"
          onClick={() => onOpenFormModal('ADD_ANALYSIS_DATASET')}
        >
          Add Analysis Dataset
        </Button>
      }
      <span className={styles.separator}>|</span>
    </>
  );
};

export default DataFilesProjectFileListingAddon;
