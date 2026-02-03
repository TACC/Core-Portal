import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  ShowMore,
  Section,
  Icon,
} from '_common';
import { TreeItem2 as TreeItem, SimpleTreeView } from '@mui/x-tree-view';
import styles from './DataFilesProjectPublishWizard.module.scss';
import DataDisplay from '../../utils/DataDisplay/DataDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { useFileListing } from 'hooks/datafiles';
import useDrpDatasetModals from '../../utils/hooks/useDrpDatasetModals';
import { fetchUtil } from 'utils/fetchUtil';
import { createTheme, ThemeProvider } from '@mui/material';
import { EXCLUDED_METADATA_FIELDS } from '../../constants/metadataFields';
import { useHistory, useLocation } from 'react-router-dom';

const theme = createTheme({
  components: {
    MuiTreeItem2: {
      styleOverrides: {
        root: {
          "& > .MuiTreeItem-content.Mui-selected": {
            backgroundColor: 'transparent',
          }
        },
      }
    }
  }
})

export const ProjectTreeView = ({ projectId, readOnly = false }) => {
  const history = useHistory();
  const location = useLocation();
  const [expandedNodes, setExpandedNodes] = useState([]);

  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);

  const [tree, setTree] = useState([]);

  const { dynamicFormModal, previewModal, projectTreeModal, metadata } = useSelector((state) => ({
    dynamicFormModal: state.files.modals.dynamicform,
    previewModal: state.files.modals.preview,
    projectTreeModal: state.files.modals.projectTree,
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

  // Helper function to find a node by path and collect all parent node IDs
  const findNodeByPath = (nodes, targetPath, parentIds = []) => {
    if (!nodes || !Array.isArray(nodes)) return null;

    targetPath = targetPath.replace(/\/+$/, '')

    for (const node of nodes) {
      const currentPath = (node.path || '').replace(/\/+$/, '');
      const currentParentIds = [...parentIds, node.id];

      if (currentPath === targetPath) {
        return currentParentIds;
      }

      // search in children
      if (node.children && node.children.length > 0) {
        const result = findNodeByPath(node.children, targetPath, currentParentIds);
        if (result) return result;
      }

      // search in fileObjs
      if (node.fileObjs && node.fileObjs.length > 0) {
        const result = findNodeByPath(node.fileObjs, targetPath, currentParentIds);
        if (result) return result;
      }
    }

    return null;
  };

  useEffect(() => {
    if (tree && tree.length > 0) {
      const regex = /^.*?\/projects\/[^/]+\/[^/]+/;
      const baseUrlMatch = location.pathname.match(regex);
      
      if (baseUrlMatch) {
        const baseUrl = baseUrlMatch[0];
        const nodePath = location.pathname.substring(baseUrl.length + 1);
        
        // Find the node by path and get all parent IDs
        const parentIds = findNodeByPath(tree, nodePath);
        
        if (parentIds && parentIds.length > 0) {
          setExpandedNodes(parentIds);
        } else {
          setExpandedNodes([tree[0].id]);
        }
      } else {
        setExpandedNodes([tree[0].id]);
      }
    }
  }, [tree, location.pathname]);

  const handleNodeToggle = (event, node) => {
    // Update the list of expanded nodes
    setExpandedNodes((prev) => {
      if (prev.includes(node)) {
        return prev.filter((id) => id !== node);
      }
      return [...prev, node];
    });
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

  const onGoTo = (node) => {

    const regex = /^.*?\/projects\/[^/]+\/[^/]+/;
    const baseUrl = location.pathname.match(regex)[0];

    if (node.metadata.data_type === 'file') {
      history.push(`${baseUrl}/${node.path.split('/').slice(0, -1).join('/')}`);
    } else {
      history.push(`${baseUrl}/${node.path}`);
    }

    if (projectTreeModal) {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'projectTree', props: {} },
      });
    }
  };

  const formatDatatype = (data_type) =>
    data_type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const renderTree = (node) => {
    
    let treeItemSlots; 

    if (node.children && node.children.length > 0) {
      treeItemSlots = {
        collapseIcon: () => <Icon name={'contract'} />,
        expandIcon: () => <Icon name={'expand'} />,
      };
    } else {
      treeItemSlots = {
        icon: () => <Icon name={'expand'} />,
      };
    }

    return (
    <>
      <Section
        key={node.id}
        className={styles['section-project-structure']}
        contentLayoutName="oneColumn"
      >
        <div>
          <TreeItem
            key={node.id}
            itemId={node.id}
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
            slots={treeItemSlots}
          >
            {expandedNodes.includes(node.id) && node.id !== 'NODE_ROOT' && (
              <div className={styles['metadata-description-div']}>
                <div className={styles['tree-button-div']}>
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
                  <span className={styles['separator']}>|</span>
                  {(
                    <Button
                      className={styles['edit-button']}
                      type="link"
                      onClick={() => onGoTo(node)}
                    >
                      Go To {formatDatatype(node.metadata.data_type)}
                    </Button>
                  )}
                </div>
                <div className={styles['description']}>
                  <ShowMore>{node.metadata.description}</ShowMore>
                  <DataDisplay
                    data={node.metadata}
                    tree={tree[0]}
                    system={projectId}
                    excludeKeys={EXCLUDED_METADATA_FIELDS}
                  />
                </div>
              </div>
            )}
            {Array.isArray(node.fileObjs) &&
              node.fileObjs.map((fileObj) => (
                <React.Fragment key={fileObj.id}>
                  {renderTree(fileObj)}
                </React.Fragment>
              ))}
            {Array.isArray(node.children) &&
              node.children.map((child) => (
                <React.Fragment key={child.id}>
                  {renderTree(child)}
                </React.Fragment>
              ))}
          </TreeItem>
        </div>
      </Section>
    </>
  );
}

  return (tree &&
  tree.length > 0 && (
    <ThemeProvider theme={theme}>
      <SimpleTreeView
        expandedItems={expandedNodes}
        onItemClick={handleNodeToggle}
      >
        {tree.map((node) => (
          <React.Fragment key={node.id}>
            {renderTree(node)}
          </React.Fragment>
        ))}
      </SimpleTreeView>
    </ThemeProvider>
  ));
};