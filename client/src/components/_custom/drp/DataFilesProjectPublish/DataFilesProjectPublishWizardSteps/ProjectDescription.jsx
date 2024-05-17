import React, { useEffect, useState } from 'react';
import {
  Button,
  ShowMore,
  SectionTableWrapper,
  DescriptionList,
} from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';

const ProjectDescription = ({ project }) => {
  const onEdit = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} },
    });
  };

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Proofread Project</div>}
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
      <DescriptionList
        data={{
          Title: project.title,
          Created: project.created,
          Abstract: <ShowMore> {project.description} </ShowMore>,
        }}
        direction={'vertical'}
      />
    </SectionTableWrapper>
  );
};

export default ProjectDescription;
