import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Button } from '_common';
import { useFileListing } from 'hooks/datafiles';
import { ProjectTree as CoreProjectTree } from '_common/ProjectMetadata';
import useDrpDatasetModals from '../utils/hooks/useDrpDatasetModals';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';
import styles from './DataFilesProjectTree.module.scss';

// DRP's tree = the generic core tree + a per-node Edit action for dataset entities
export const ProjectTree = ({ projectId, readOnly = false }) => {
  const portalName = useSelector((state) => state.workbench.portalName);
  const { params } = useFileListing('FilesListing');
  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } =
    useDrpDatasetModals(projectId, portalName, false);

  const onEditData = (node) => {
    // reconstruct editFile to mimic SelectedFile object
    const editFile = {
      id: node.id,
      uuid: node.uuid,
      metadata: node.metadata,
      name: node.metadata.name,
      system: params.system,
      type: 'dir',
      path: node.path,
    };
    switch (node.metadata.data_type) {
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

  const nodeActions = (node) =>
    readOnly ? null : (
      <Button
        className={styles['edit-button']}
        type="link"
        onClick={() => onEditData(node)}
      >
        Edit
      </Button>
    );

  return (
    <CoreProjectTree
      projectId={projectId}
      excludeKeys={EXCLUDED_METADATA_FIELDS}
      nodeActions={nodeActions}
    />
  );
};

ProjectTree.propTypes = {
  projectId: PropTypes.string,
  readOnly: PropTypes.bool,
};

export default ProjectTree;
