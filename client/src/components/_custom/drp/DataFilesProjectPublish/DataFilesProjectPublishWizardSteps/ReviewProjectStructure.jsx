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

  useEffect(() => {
    if (projectTree && projectTree.length > 0) {
      setExpandedNodes([projectTree[0].uuid]);
    }
  }, [projectTree]);

  const handleNodeToggle = (event, nodeIds) => {
    // Update the list of expanded nodes
    setExpandedNodes(nodeIds);
  };

  const { createSampleModal, createOriginDataModal, createAnalysisDataModal } =
    useDrpDatasetModals(projectId, portalName, false);

  const canEdit = useSelector((state) => {
    const { members } = state.projects.metadata;
    const { username } = state.authenticatedUser.user;
    const currentUser = members.find((member) => member.user?.username === username);
  
    if (!currentUser) {
      return false;
    }
  
    return currentUser.access === 'owner' || currentUser.access === 'edit';
  });

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
      id: node.uuid,
      uuid: node.uuid,
      metadata: node.metadata,
      name: node.metadata.name,
      system: params.system,
      type: 'dir',

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
    data_type.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const renderTree = (node) => {
    return (
    <>
      <Section
        className={styles['section-project-structure']}
        contentLayoutName="oneColumn"
      >
        <div>
          <TreeItem
            key={node.uuid}
            nodeId={node.uuid}
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
            {expandedNodes.includes(node.uuid) && node.id !== 'NODE_ROOT' && (
              <div className={styles['metadata-description-div']}>
                {(canEdit || node.metadata.data_type === 'file') && (
                  <Button
                    className={styles['edit-button']}
                    type="link"
                    onClick={() => onEditData(node)}
                  >
                    {canEdit && node.metadata.data_type !== 'file' ? 'Edit' : 'View'}
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
                      'base_origin_data',
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
  )};

  return (
    <SectionTableWrapper
      header={
        <div className={styles.title}>
          Review Data Structure and Description
        </div>
      }
      headerActions={
        <>
          {canEdit && (
            <div className={styles.controls}>
              <>
                <Button type="link" onClick={onEdit}>
                  Edit Project
                </Button>
              </>
            </div>
          )}
        </>
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
            expanded={expandedNodes}
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
