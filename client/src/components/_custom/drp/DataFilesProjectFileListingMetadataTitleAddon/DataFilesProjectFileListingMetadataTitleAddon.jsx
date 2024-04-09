import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataTitleAddon.module.scss';
import { Button } from '_common';
import { useSelectedFiles } from 'hooks/datafiles';
import { fetchUtil } from 'utils/fetchUtil';

const DataFilesProjectFileListingMetadataTitleAddon = ({ folderMetadata, system, path }) => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);

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

  const onEditData = (dataType) => {
    const name = path.split('/').pop();
    // reconstruct editFile to mimic SelectedFile object
    const editFile = {
      "format": "folder",
      "id" : system + "/" + path,
      "metadata": folderMetadata,
      "name": name,
      "system": system,
      "path": path,
      "type": "dir",
      "_links": {
        "self": {
          "href": "tapis://" + system + "/" + path,
        },
      }
    };
    switch (dataType) {
      case 'sample':
        onOpenSampleModal('EDIT_SAMPLE_DATA', editFile);
        break;
      case 'origin_data':
        onOpenOriginDataModal('EDIT_ORIGIN_DATASET', editFile);
        break;
      case 'analysis_data':
        onOpenAnalysisDataModal('EDIT_ANALYSIS_DATASET', editFile);
        break;
      default:
        break;
    }
  }

  return (
    <>
      {folderMetadata.name}
      {folderMetadata?.data_type && (
        <span className={styles['dataTypeBox']}>
          {folderMetadata.data_type}
        </span>
      )}
      <Button
          type="link"
          onClick={() => onEditData(folderMetadata.data_type)}
        >

          Edit Data
        </Button>
    </>
  );
};

DataFilesProjectFileListingMetadataTitleAddon.propTypes = {
  folderMetadata: PropTypes.object.isRequired,
};

export default DataFilesProjectFileListingMetadataTitleAddon;