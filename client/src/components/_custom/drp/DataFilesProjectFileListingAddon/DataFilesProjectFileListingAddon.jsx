import React, { useEffect, useState } from 'react';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DataFilesProjectFileListingAddon.module.scss';
import { useSelectedFiles } from 'hooks/datafiles';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';

const DataFilesProjectFileListingAddon = () => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);
  const { selectedFiles } = useSelectedFiles();

  const getFormFields = async (formName) => {
    const response = await fetchUtil({
      url: 'api/forms',
      params: {
        form_name: formName,
      },
    });
    return response;
  };

  const getSamples = async (projectId, getOriginData = false) => {
    const response = await fetchUtil({
      url: `api/${portalName.toLowerCase()}`,
      params: {
        project_id: projectId,
        get_origin_data: getOriginData,
      },
    });
    return response;
  };

  const onOpenSampleModal = async (formName, selectedFile) => {

    const form = await getFormFields(formName);

    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: { form, selectedFile, formName },
      },
    });
  };

  const onOpenOriginDataModal = async (formName, selectedFile) => {
    const form = await getFormFields(formName);
    const samples = await getSamples(projectId);

    form.form_fields.map((field) => {
      if (field.name === 'sample') {
        field.options = samples.map((sample) => {
          return {
            value: parseInt(sample.id),
            label: sample.name,
          };
        });
      }
    });

    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: { selectedFile, form, formName, additionalData: samples },
      },
    });
  };

  const onOpenAnalysisDataModal = async (formName, selectedFile) => {
    const form = await getFormFields(formName);
    const samples = await getSamples(projectId, true);

    form.form_fields.map((field) => {
      if (field.name === 'base_origin_data') {
        field.optgroups = samples.map((sample) => {
          return {
            label: sample.name,
            options: sample.origin_data.map((originData) => {
              return {
                value: parseInt(originData.id),
                label: originData.name,
              };
            }),
          };
        });
      }
    });

    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: { selectedFile, form, formName, additionalData: samples },
      },
    });
  };

  return (
    <>
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata &&
        selectedFiles[0].metadata['data_type'] === 'sample' ? (
          <Button
            type="link"
            onClick={() => onOpenSampleModal('EDIT_SAMPLE_DATA', selectedFiles[0])}
          >
            Edit Sample Data
          </Button>
        ) : (
          <Button type="link" onClick={() => onOpenSampleModal('ADD_SAMPLE_DATA')}>
            Add Sample Data
          </Button>
        )}
      <span className={styles.separator}>|</span>
      {selectedFiles.length == 1 && selectedFiles[0]?.metadata &&
        selectedFiles[0].metadata['data_type'] === 'origin_data' ? (
          <Button
            type="link"
            onClick={() =>
              onOpenOriginDataModal('EDIT_ORIGIN_DATASET', selectedFiles[0])
            }
          >
            Edit Origin Dataset
          </Button>
        ) : (
          <Button
            type="link"
            onClick={() => onOpenOriginDataModal('ADD_ORIGIN_DATASET')}
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
              onOpenAnalysisDataModal('EDIT_ANALYSIS_DATASET', selectedFiles[0])
            }
          >
            Edit Analysis Dataset
          </Button>
        ) : (
          <Button
            type="link"
            onClick={() => onOpenAnalysisDataModal('ADD_ANALYSIS_DATASET')}
          >
            Add Analysis Dataset
          </Button>
        )}
      <span className={styles.separator}>|</span>
    </>
  );
};

export default DataFilesProjectFileListingAddon;
