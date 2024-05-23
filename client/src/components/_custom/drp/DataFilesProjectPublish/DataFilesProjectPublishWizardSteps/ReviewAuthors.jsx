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

const MLACitation = ({ project, users }) => {
  let authorString;

  if (users.length === 1) {
    authorString = `${users[0].last_name}, ${users[0].first_name}`;
  } else if (users.length === 2) {
    authorString = `${users[0].last_name}, ${users[0].first_name}, and ${users[1].last_name}, ${users[1].first_name}`;
  } else {
    authorString = `${users[0].last_name}, ${users[0].first_name}, et al`;
  }

  const mlaText = `${authorString}. "${project.title}." Digital Rocks Portal `;

  return (
    <>
      <h2>MLA</h2>
      <div className={styles['citation-box']}>
        <div>{mlaText}</div>
      </div>
    </>
  );
};

const ReviewAuthors = ({ project, users, setUsers }) => {
  useEffect(() => {
    const formattedUsers = project.members.map((user) => user.user);
    setUsers(formattedUsers);
  }, [project]);

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Review Authors and Citation</div>}
    >
      {users.length > 0 && project && (
        <Section contentLayoutName={'oneColumn'}>
          <MLACitation project={project} users={users} />
          <ReorderUserList users={users} setUsers={setUsers} />
        </Section>
      )}
    </SectionTableWrapper>
  );
};

export const ReviewAuthorsStep = ({ project, users, setUsers }) => ({
  id: 'project_authors',
  name: 'Review Authors and Citations',
  render: <ReviewAuthors project={project} users={users} setUsers={setUsers} />,
  initialValues: {},
});
