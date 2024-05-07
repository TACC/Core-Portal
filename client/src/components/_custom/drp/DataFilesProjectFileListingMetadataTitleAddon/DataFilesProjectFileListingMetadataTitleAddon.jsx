import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataTitleAddon.module.scss';
import { Button, LoadingSpinner } from '_common';
import { fetchUtil } from 'utils/fetchUtil';
import { useFileListing } from 'hooks/datafiles';
import { createSampleModalHandler, createOriginDataModalHandler, createAnalysisDataModalHandler } from '../utils/datasetFormHandlers';

const DataFilesProjectFileListingMetadataTitleAddon = ({ folderMetadata, metadata, system, path }) => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);

  const { loading } = useFileListing('FilesListing');

  const handleSampleModal = createSampleModalHandler(dispatch);
  const handleOriginDataModal = createOriginDataModalHandler(dispatch, projectId, portalName);
  const handleAnalysisDataModal = createAnalysisDataModalHandler(dispatch, projectId, portalName);

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
        handleSampleModal('EDIT_SAMPLE_DATA', editFile);
        break;
      case 'origin_data':
        handleOriginDataModal('EDIT_ORIGIN_DATASET', editFile);
        break;
      case 'analysis_data':
        handleAnalysisDataModal('EDIT_ANALYSIS_DATASET', editFile);
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
  folderMetadata: PropTypes.shape({}).isRequired,
};

export default DataFilesProjectFileListingMetadataTitleAddon;