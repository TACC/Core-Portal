import React, { useEffect } from 'react';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DataFilesProjectListingAddon.module.scss';

const DataFilesProjectFileListingAddon = () => {
  const dispatch = useDispatch();

  const onOpenFormModal = (form_name) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: { formName: form_name },
      },
    });
  };

  return (
    <>
      <span className={styles.separator}>|</span>
      <Button type="link" onClick={() => onOpenFormModal('ADD_SAMPLE_DATA')}>
        Add Sample Data
      </Button>
      <span className={styles.separator}>|</span>
      <Button type="link" onClick={() => onOpenFormModal('ADD_ORIGIN_DATASET')}>
        Add Origin Dataset
      </Button>
      <span className={styles.separator}>|</span>
      <Button
        type="link"
        onClick={() => onOpenFormModal('ADD_ANALYSIS_DATASET')}
      >
        Add Analysis Dataset
      </Button>
    </>
  );
};

export default DataFilesProjectFileListingAddon;
