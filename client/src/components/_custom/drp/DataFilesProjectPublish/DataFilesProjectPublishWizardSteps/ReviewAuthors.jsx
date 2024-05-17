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
} from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';
import ReorderUserList from '../../utils/ReorderUserList/ReorderUserList';

const ReviewAuthors = ({ project }) => {
  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Review Authors and Citation</div>}
    >
      <ReorderUserList users={project.members} />
    </SectionTableWrapper>
  );
};

export default ReviewAuthors;
