import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ShowMore, Section, Icon } from '_common';
import { TreeItem2 as TreeItem, SimpleTreeView } from '@mui/x-tree-view';
import { createTheme, ThemeProvider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useFileListing, useProjectTree } from 'hooks/datafiles';
import { formatLabel } from 'utils/formatLabel';
import MetadataDisplay from '../MetadataDisplay/MetadataDisplay';
import styles from './ProjectTree.module.scss';

const theme = createTheme({
  components: {
    MuiTreeItem2: {
      styleOverrides: {
        root: {
          '& > .MuiTreeItem-content.Mui-selected': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
  },
});

/**
 * Generic project metadata tree with basic functionality: it renders the
 * project's entity/file tree, navigation, file preview, and each
 * node's metadata.
 */
export const ProjectTree = ({ projectId, excludeKeys = [], nodeActions }) => {
  const history = useHistory();
  const location = useLocation();
  const [expandedNodes, setExpandedNodes] = useState([]);

  const dispatch = useDispatch();

  const { data: tree = [], refetch: fetchTree } = useProjectTree(projectId);

  const { dynamicFormModal, previewModal, projectTreeModal } = useSelector(
    (state) => ({
      dynamicFormModal: state.files.modals.dynamicform,
      previewModal: state.files.modals.preview,
      projectTreeModal: state.files.modals.projectTree,
    })
  );

  useEffect(() => {
    // workaround to get updated data after modal closes
    if (!dynamicFormModal || !previewModal) {
      fetchTree();
    }
  }, [dynamicFormModal, previewModal, fetchTree]);

  const { params } = useFileListing('FilesListing');

  // Find a node by path and collect all parent node IDs.
  const findNodeByPath = (nodes, targetPath, parentIds = []) => {
    if (!nodes || !Array.isArray(nodes)) return null;

    targetPath = targetPath.replace(/\/+$/, '');

    for (const node of nodes) {
      const currentPath = (node.path || '').replace(/\/+$/, '');
      const currentParentIds = [...parentIds, node.id];

      if (currentPath === targetPath) {
        return currentParentIds;
      }

      if (node.children && node.children.length > 0) {
        const result = findNodeByPath(
          node.children,
          targetPath,
          currentParentIds
        );
        if (result) return result;
      }

      if (node.fileObjs && node.fileObjs.length > 0) {
        const result = findNodeByPath(
          node.fileObjs,
          targetPath,
          currentParentIds
        );
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
    setExpandedNodes((prev) => {
      if (prev.includes(node)) {
        return prev.filter((id) => id !== node);
      }
      return [...prev, node];
    });
  };

  const onPreviewFile = (node) => {
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

    const isFile = node.metadata.data_type === 'file';
    const actionButton = isFile ? (
      <Button
        className={styles['edit-button']}
        type="link"
        onClick={() => onPreviewFile(node)}
      >
        View
      </Button>
    ) : (
      nodeActions && nodeActions(node)
    );

    return (
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
                    {formatLabel(node.metadata.data_type)}
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
                  {actionButton && (
                    <>
                      {actionButton}
                      <span className={styles['separator']}>|</span>
                    </>
                  )}
                  <Button
                    className={styles['edit-button']}
                    type="link"
                    onClick={() => onGoTo(node)}
                  >
                    Go To {formatLabel(node.metadata.data_type)}
                  </Button>
                </div>
                <div className={styles['description']}>
                  <ShowMore className={styles['description-show-more']}>
                    {node.metadata.description}
                  </ShowMore>
                  <MetadataDisplay
                    data={node.metadata}
                    tree={tree[0]}
                    system={projectId}
                    excludeKeys={excludeKeys}
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
    );
  };

  return (
    tree &&
    tree.length > 0 && (
      <ThemeProvider theme={theme}>
        <SimpleTreeView
          expandedItems={expandedNodes}
          onItemClick={handleNodeToggle}
        >
          {tree.map((node) => (
            <React.Fragment key={node.id}>{renderTree(node)}</React.Fragment>
          ))}
        </SimpleTreeView>
      </ThemeProvider>
    )
  );
};

ProjectTree.propTypes = {
  projectId: PropTypes.string,
  excludeKeys: PropTypes.array,
  nodeActions: PropTypes.func,
};

export default ProjectTree;
