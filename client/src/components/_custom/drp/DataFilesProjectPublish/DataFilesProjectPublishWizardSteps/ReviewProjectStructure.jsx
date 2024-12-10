import React, { useEffect, useState, useCallback } from 'react';
import { Button, SectionTableWrapper, Section } from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useFileListing } from 'hooks/datafiles';
import { ProjectTreeView } from './ProjectTreeView';

export const ReviewProjectStructure = ({ projectTree }) => {
  const dispatch = useDispatch();

  const { projectId } = useSelector((state) => state.projects.metadata);

  const { params } = useFileListing('FilesListing');

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
              Make sure the relationships between sample, origin data and
              analysis data are correct in the tree and add if needed.
            </li>
          </ul>
        </div>

        <ProjectTreeView projectId={projectId} readOnly={!canEdit} />
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
