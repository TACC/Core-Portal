import React, { useEffect, useState } from 'react';
import {
  Button,
  ShowMore,
  LoadingSpinner,
  SectionMessage,
  SectionTableWrapper,
  DescriptionList,
  Section,
  SectionContent,
  Expand,
  Icon,
} from '_common';
import { TreeItem, TreeView } from '@material-ui/lab';
import styles from './DataFilesProjectPublishWizard.module.scss';
import DataDisplay from '../../utils/DataDisplay/DataDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { useFileListing } from 'hooks/datafiles';
import useDrpDatasetModals from '../../utils/hooks/useDrpDatasetModals';

const ReviewProjectStructure = ({ projectTree }) => {
  const dispatch = useDispatch();

  const [expandedNodes, setExpandedNodes] = useState([]);

  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);

  const { params } = useFileListing('FilesListing');

  const handleNodeToggle = (event, nodeIds) => {
    // Update the list of expanded nodes
    setExpandedNodes(nodeIds);
  };

  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } =
    useDrpDatasetModals(projectId, portalName, false);

  const onEdit = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} },
    });
  };

  const onEditData = (node) => {
    const dataType = node.metadata.data_type;
    // reconstruct editFile to mimic SelectedFile object
    const editFile = {
      format: 'folder',
      id: node.path,
      metadata: node.metadata,
      name: node.metadata.name,
      system: params.system,
      path: node.path.split('/').slice(1).join('/'),
      type: 'dir',
      _links: {
        self: {
          href: 'tapis://' + node.path,
        },
      },
    };
    switch (dataType) {
      case 'sample':
        createSampleModal('EDIT_SAMPLE_DATA', editFile);
        break;
      case 'origin_data':
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
              path: node.path.split('/').slice(1).join('/'),
              name: node.metadata.name,
              href: 'tapis://' + node.path,
              length: node.metadata.length,
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
            label={node.name}
            classes={{
              label: styles['tree-label'],
            }}
            onLabelClick={() => handleNodeToggle}
          >
            {expandedNodes.includes(node.id) && (
              <div className={styles['metadata-description-div']}>
                <Button
                  className={styles['edit-button']}
                  type="link"
                  onClick={() => onEditData(node)}
                >
                  {node.metadata.data_type === 'file' ? 'View' : 'Edit'}
                </Button>
                <div className={styles['description']}>
                  <ShowMore>{node.metadata.description}</ShowMore>
                  <DataDisplay
                    data={node.metadata}
                    excludeKeys={[
                      'description',
                      'data_type',
                      'sample',
                      'base_origin_data',
                    ]}
                  />
                </div>
              </div>
            )}
            {Array.isArray(node.children) &&
              node.children.map((child) => renderTree(child))}
          </TreeItem>
        </div>
      </Section>
    </>
  );

  const getAllNodeIds = (nodes) => {
    const ids = [];
    nodes.forEach((node) => {
      ids.push(node.id);
      if (Array.isArray(node.children)) {
        ids.push(...getAllNodeIds(node.children));
      }
    });
    return ids;
  };

  return (
    <SectionTableWrapper
      header={
        <div className={styles.title}>
          Review Data Structure and Description
        </div>
      }
      headerActions={
        <div className={styles.controls}>
          <>
            <Button type="link" onClick={onEdit}>
              Edit Project
            </Button>
          </>
        </div>
      }
    >
      <Section
        contentLayoutName={'oneColumn'}
        className={styles['description-section']}
      >
        <div className={styles['description']}>
          <p>
            Review the data tree structure to make sure that the relationships
            between the data components are correct:
          </p>
          <ul>
            <li>
              Spell check the description and ensure it is clear and complete so
              your project is understandable and searchable.
            </li>
            <li>Check if the data is rendered.</li>
            <li>Review image metadata for rendering.</li>
            <li>
              Make sure the relationships between sample, origin data and
              analysis data are correct in the tree and add if needed.
            </li>
          </ul>
        </div>

        {projectTree && projectTree.length > 0 && (
          <TreeView
            defaultCollapseIcon={<Icon name={'contract'} />}
            defaultExpandIcon={<Icon name={'expand'} />}
            // expanded={getAllNodeIds(tree)}
            onNodeToggle={handleNodeToggle}
          >
            {projectTree.map((node) => renderTree(node))}
          </TreeView>
        )}
      </Section>
    </SectionTableWrapper>
  );
};

export const ReviewProjectStructureStep = ({ projectTree }) => ({
  id: 'project_structure',
  name: 'Review Project Structure',
  render: <ReviewProjectStructure projectTree={projectTree} />,
  initialValues: {},
});