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
import ProjectMembersList from '../../utils/ProjectMembersList/ProjectMembersList';
import { useSelector } from 'react-redux';

const MLACitation = ({ project, authors }) => {
  let authorString;

  if (authors.length === 1) {
    authorString = `${authors[0].last_name}, ${authors[0].first_name}`;
  } else if (authors.length === 2) {
    authorString = `${authors[0].last_name}, ${authors[0].first_name}, and ${authors[1].last_name}, ${authors[1].first_name}`;
  } else {
    authorString = `${authors[0].last_name}, ${authors[0].first_name}, et al`;
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

const ReviewAuthors = ({ project, onAuthorsUpdate }) => {
  const [authors, setAuthors] = useState([]);
  const [members, setMembers] = useState([]);


  const canEdit = useSelector((state) => {
    const { members } = state.projects.metadata;
    const { username } = state.authenticatedUser.user;
    const currentUser = members.find((member) => member.user?.username === username);
  
    if (!currentUser) {
      return false;
    }
  
    return currentUser.access === 'owner' || currentUser.access === 'edit';
  });

  useEffect(() => {
    const owners = project.authors?.length > 0 ? project.authors : project.members
      .filter((user) => user.access === 'owner')
      .map((user) => ({ ...user.user, isOwner: true }));

    const members = project.members
      .filter(
        (user) =>
          (user.access === 'read' || user.access === 'edit') &&
          !authors.includes(user.user)
      )
      .map((user) => user.user);

    setAuthors(owners);
    setMembers(members);
    onAuthorsUpdate(owners);
  }, [project]);

  const onReorder = (authors) => {
    setAuthors(authors);
    onAuthorsUpdate(authors);
  };

  const onAddAuthor = (member) => {
    const newAuthors = [...authors, member];
    setAuthors(newAuthors);
    setMembers((prevMembers) => prevMembers.filter((m) => m !== member));
    onAuthorsUpdate(newAuthors);
  };

  const onRemoveCoAuthor = (member) => {
    const newAuthors = authors.filter((a) => a !== member);
    setAuthors(newAuthors);
    setMembers((prevMembers) => [...prevMembers, member]);
    onAuthorsUpdate(newAuthors);
  };

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Review Authors and Citation</div>}
    >
      {authors.length > 0 && project && (
        <Section contentLayoutName={'oneColumn'}>
          <MLACitation project={project} authors={authors} />
          {canEdit && (
            <>
              <ReorderUserList
              users={authors}
              onReorder={onReorder}
              onRemoveAuthor={onRemoveCoAuthor} />
              <ProjectMembersList members={members} onAddCoAuthor={onAddAuthor} />
            </>
          )}

        </Section>
      )}
    </SectionTableWrapper>
  );
};

export const ReviewAuthorsStep = ({ project, onAuthorsUpdate }) => ({
  id: 'project_authors',
  name: 'Review Authors and Citations',
  render: <ReviewAuthors project={project} onAuthorsUpdate={onAuthorsUpdate} />,
  initialValues: {},
});
