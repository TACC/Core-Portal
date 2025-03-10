import React, { useEffect, useState, useCallback } from 'react';
import { Button, SectionTableWrapper, Section } from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { ProjectTreeView } from './ProjectTreeView';
import { useFormikContext } from 'formik';

export const ReviewProjectStructure = ({ projectTree }) => {
  const dispatch = useDispatch();

  const { projectId } = useSelector((state) => state.projects.metadata);

  const { errors } = useFormikContext();

  const canEdit = useSelector((state) => {
    const { members } = state.projects.metadata;
    const { username } = state.authenticatedUser.user;
    const currentUser = members.find(
      (member) => member.user?.username === username
    );

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
                  Edit Dataset
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
              Make sure the relationships between sample, digital data and
              analysis data are correct in the tree and add if needed.
            </li>
          </ul>
        </div>
        {Object.keys(errors).length > 0 && (
          <div className={styles['errors-div']}>
            <p>Dataset structure has the following errors:</p>
            <ul>
              {Object.keys(errors).map((key) => (
                <li key={key}>{errors[key]}</li>
              ))}
            </ul>
          </div>
        )}
        <ProjectTreeView projectId={projectId} readOnly={!canEdit} />
      </Section>
    </SectionTableWrapper>
  );
};

const validateFolder = (node) => {
  const errors = [];
  
  const hasFileObjs = (node) => {
    // Check if the current node has fileObjs
    if (node.fileObjs && node.fileObjs.length > 0) {
      return true;
    }
    
    // Check if any children have fileObjs
    if (node.children && node.children.length > 0) {
      return node.children.some(child => hasFileObjs(child));
    }
    
    return false;
  }
  
  // Process the current node
  if (!hasFileObjs(node)) {
    errors.push(`Entity "${node.label}" (path: ${node.path}) has no files in itself or any of its child entities.`);
  }
  
  // Recursively validate all children
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      const childErrors = validateFolder(child);
      errors.push(...childErrors);
    });
  }
  
  return errors;
}

const validateProjectStructure = (tree) => {

  const validationErrors = [];

  tree.forEach((node) => {
    const nodeErrors = validateFolder(node);
    if (nodeErrors.length > 0) {
      validationErrors.push(...nodeErrors);
    }
  })

  const errors = {};

  if (validationErrors.length > 0) {
    validationErrors.forEach((error, index) => {
      const errorKey = `folder_${index}`;
      errors[errorKey] = error;
    }
    );
  }

  return errors;
}

export const ReviewProjectStructureStep = ({ projectTree }) => ({
  id: 'project_structure',
  name: 'Review Project Structure',
  render: <ReviewProjectStructure projectTree={projectTree} />,
  initialValues: projectTree,
  validate: validateProjectStructure,
});
