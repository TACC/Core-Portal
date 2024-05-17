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
  return <ReorderUserList users={project.members} />;
};

export default ReviewAuthors;
