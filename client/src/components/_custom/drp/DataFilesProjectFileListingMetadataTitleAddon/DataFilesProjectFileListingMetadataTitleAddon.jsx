import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataTitleAddon.module.scss';
import { Button, LoadingSpinner } from '_common';
import { fetchUtil } from 'utils/fetchUtil';
import { useFileListing } from 'hooks/datafiles';

const DataFilesProjectFileListingMetadataTitleAddon = ({ folderMetadata, metadata, system, path }) => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);

  const { loading } = useFileListing('FilesListing');

  const getFormFields = async (formName) => {
    const response = await fetchUtil({
      url: 'api/forms',
      params: {
        form_name: formName,
      },
    });
    return response;
  };

  const getDatasets = async (projectId, getOriginData = false) => {
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
    const { samples } = await getDatasets(projectId);

    form.form_fields.map((field) => {
      if (field.name === 'sample') {
        field.options.push(...samples.map((sample) => {
          return {
            value: parseInt(sample.id),
            label: sample.name,
          };
        }));
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
    const { samples, origin_data: originDatasets } = await getDatasets(projectId, true);

    form.form_fields.map((field) => {
      if (field.name === 'sample') {
        field.options.push(...samples.map((sample) => {
          return {
            value: parseInt(sample.id),
            label: sample.name,
          };
        }));
      } else if (field.name === 'base_origin_data') {
        field.options.push(...originDatasets.map((originData) => {
          return {
            value: parseInt(originData.id),
            label: originData.name,
            dependentId: parseInt(originData.metadata.sample),
          };
        }));
      }
    });

    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: { selectedFile, form, formName, additionalData: { samples, originDatasets } },
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

  // Function to format the data_type value from snake_case to Label Case i.e. origin_data -> Origin Data
  const formatDatatype = (data_type) => 
    data_type.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <>
        {loading ? (
          <LoadingSpinner placement="inline" />
        ) : (
          folderMetadata ? ( 
            <>
              {folderMetadata.name}
              <span className={styles['dataTypeBox']}>
                {formatDatatype(folderMetadata.data_type)}
              </span>
              <Button
                type="link"
                onClick={() => onEditData(folderMetadata.data_type)}
              >
                Edit Data
              </Button>
            </>
          ) : (
            metadata.title
          )
        )}
      </>
    );
};

DataFilesProjectFileListingMetadataTitleAddon.propTypes = {
  folderMetadata: PropTypes.object.isRequired,
};

export default DataFilesProjectFileListingMetadataTitleAddon;