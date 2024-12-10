import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  ShowMore,
  Section,
  Icon,
} from '_common';
import { TreeItem, TreeView } from '@material-ui/lab';
import styles from './DataFilesProjectPublishWizard.module.scss';
import DataDisplay from '../../utils/DataDisplay/DataDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { useFileListing } from 'hooks/datafiles';
import useDrpDatasetModals from '../../utils/hooks/useDrpDatasetModals';
import { fetchUtil } from 'utils/fetchUtil';

export const ProjectTreeView = ({ projectId, readOnly = false }) => {
  const [expandedNodes, setExpandedNodes] = useState([]);

  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);

  const [tree, setTree] = useState([]);

  const { dynamicFormModal, previewModal, metadata } = useSelector((state) => ({
    dynamicFormModal: state.files.modals.dynamicform,
    previewModal: state.files.modals.preview,
    metadata: state.projects.metadata,
  }));

  const fetchTree = useCallback(async () => {
    if (projectId) {
      try {
        const response = await fetchUtil({
          url: `api/${portalName.toLowerCase()}/tree`,
          params: {
            project_id: projectId,
          },
        });
        setTree(response);
      } catch (error) {
        console.error('Error fetching tree data:', error);
        setTree([]);
      }
    }
  }, [portalName, projectId]);

  useEffect(() => {
    // workaround to get updated data after modal closes
    if (!dynamicFormModal || !previewModal) {
      fetchTree();
    }
  }, [dynamicFormModal, previewModal, fetchTree]);

  const { params } = useFileListing('FilesListing');

  useEffect(() => {
    if (tree && tree.length > 0) {
      setExpandedNodes([tree[0].id]);
    }
  }, []);

  const handleNodeToggle = (event, nodeIds) => {
    // Update the list of expanded nodes
    setExpandedNodes(nodeIds);
  };

  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } =
    useDrpDatasetModals(projectId, portalName, false);

  const onEditData = (node) => {
    const dataType = node.metadata.data_type;
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
      case 'file':
        // Dispatch an action to toggle the modal for previewing the file
        dispatch({
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: {
            operation: 'preview',
            props: {
              api: params.api,
              scheme: params.scheme,
              system: params.system,
              path: node.path,
              name: node.name,
              href: `tapis://${params.system}/${node.path}`,
              length: node.length,
              metadata: node.metadata,
              useReloadCallback: false,
            },
          },
        });
        break;
      default:
        break;
    }
  };

  const formatDatatype = (data_type) =>
    data_type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const renderTree = (node) => (
    <>
      <Section
        className={styles['section-project-structure']}
        contentLayoutName="oneColumn"
      >
        <div>
          <TreeItem
            key={node.id}
            nodeId={node.id}
            label={
              <div className={styles['node-name-div']}>
                {node.label ?? node.name}
                {node.metadata.data_type && (
                  <span className={styles['data-type-box']}>
                    {formatDatatype(node.metadata.data_type)}
                  </span>
                )}
              </div>
            }
            classes={{
              label: styles['tree-label'],
            }}
            onLabelClick={() => handleNodeToggle}
          >
            {expandedNodes.includes(node.id) && node.id !== 'NODE_ROOT' && (
              <div className={styles['metadata-description-div']}>
                {(!readOnly || node.metadata.data_type === 'file') && (
                  <Button
                    className={styles['edit-button']}
                    type="link"
                    onClick={() => onEditData(node)}
                  >
                    {!readOnly && node.metadata.data_type !== 'file'
                      ? 'Edit'
                      : 'View'}
                  </Button>
                )}
                <div className={styles['description']}>
                  <ShowMore>{node.metadata.description}</ShowMore>
                  <DataDisplay
                    data={node.metadata}
                    excludeKeys={[
                      'description',
                      'data_type',
                      'sample',
                      'digital_dataset',
                      'file_objs',
                    ]}
                  />
                </div>
              </div>
            )}
            {Array.isArray(node.fileObjs) &&
              node.fileObjs.map((fileObj) => renderTree(fileObj))}
            {Array.isArray(node.children) &&
              node.children.map((child) => renderTree(child))}
          </TreeItem>
        </div>
      </Section>
    </>
  );

  return (
    tree &&
    tree.length > 0 && (
      <TreeView
        defaultCollapseIcon={<Icon name={'contract'} />}
        defaultExpandIcon={<Icon name={'expand'} />}
        expanded={expandedNodes}
        onNodeToggle={handleNodeToggle}
      >
        {tree.map((node) => renderTree(node))}
      </TreeView>
    )
  );
};