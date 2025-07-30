import React, { useEffect, useState } from 'react';
import {
  Button,
  SectionTableWrapper,
  Section,
} from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';
import ReorderUserList from '../../utils/ReorderUserList/ReorderUserList';
import ProjectMembersList from '../../utils/ProjectMembersList/ProjectMembersList';
import { useDispatch, useSelector } from 'react-redux';

const ACMCitation = ({ project, authors }) => {
  const authorString = authors
    .map((a) => `${a.first_name} ${a.last_name}`)
    .join(', ');
  // Use DOI if available, fallback to project URL
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;
  const createdDate = new Date(project.created).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      {`${authorString}. ${project.title}. `} <em>Digital Porous Media</em>{' '}
      {` (${createdDate}). ${projectUrl}`}{' '}
    </div>
  );
};

const APACitation = ({ project, authors }) => {
  const authorString = authors
    .map((a) => `${a.last_name}, ${a.first_name.charAt(0)}.`)
    .join(', ');
  // Use DOI if available, fallback to project URL
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;
  const createdDateObj = new Date(project.created);
  const createdDate = `${createdDateObj.getFullYear()}, ${createdDateObj.toLocaleString(
    'en-US',
    { month: 'long' }
  )} ${createdDateObj.getDate()}`;
  const accessDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>{`${authorString} (${createdDate}). ${project.title}. Retrieved ${accessDate}, from ${projectUrl}`}</div>
  );
};

const BibTeXCitation = ({ project, authors }) => {
  const authorString = authors
    .map((a) => `${a.last_name}, ${a.first_name}`)
    .join(' and ');
  // Use DOI if available, fallback to project URL
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;
  const year = new Date(project.created).getFullYear();

  return (
    <pre>{`@misc{dataset,
  author = {${authorString}},
  title = {${project.title}},
  year = {${year}},
  publisher = {Digital Porous Media},
  doi = {},
  howpublished = {\\url{${projectUrl}}}
}`}</pre>
  );
};

export const MLACitation = ({ project, authors }) => {
  const authorString = authors
    .map((a) => `${a.last_name}, ${a.first_name}`)
    .join(', ');
  // Use DOI if available, fallback to project URL
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;
  const createdDate = new Date(project.publication_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const accessDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      {`${authorString}. "${project.title}."`} <em>Digital Porous Media,</em>{' '}
      {` Digital Porous Media, ${createdDate}, ${projectUrl} Accessed ${accessDate}.`}
    </div>
  );
};

const IEEECitation = ({ project, authors }) => {
  const authorString = authors
    .map((a) => `${a.first_name[0]}. ${a.last_name}`)
    .join(', ');
  // Use DOI if available, fallback to project URL
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;
  const date = new Date(project.created);
  const year = date.getFullYear();
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });

  return (
    <div>
      {`[1] ${authorString}, "${project.title}",`}{' '}
      <em>Digital Porous Media,</em>{' '}
      {` ${year}. [Online]. Available: ${projectUrl}. [Accessed: ${day}-${month}-${year}]`}
    </div>
  );
};

export const Citations = ({ project, authors }) => (
  <div>
    <h3>ACM ref</h3>
    <div className={styles['citation-box']}>
      <ACMCitation project={project} authors={authors} />
    </div>

    <h3>APA</h3>
    <div className={styles['citation-box']}>
      <APACitation project={project} authors={authors} />
    </div>

    <h3>BibTeX</h3>
    <div className={styles['citation-box']}>
      <BibTeXCitation project={project} authors={authors} />
    </div>

    <h3>MLA</h3>
    <div className={styles['citation-box']}>
      <MLACitation project={project} authors={authors} />
    </div>

    <h3>IEEE</h3>
    <div className={styles['citation-box']}>
      <IEEECitation project={project} authors={authors} />
    </div>
  </div>
);

const ReviewAuthors = ({ project, onAuthorsUpdate }) => {
  const [authors, setAuthors] = useState([]);
  const [members, setMembers] = useState([]);

  const dispatch = useDispatch();

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

  useEffect(() => {
    const owners =
      project.authors?.length > 0
        ? project.authors
        : project.members
            .filter((user) => user.access === 'owner')
            .map((user) => ({ ...user.user, isOwner: true }));

    const members = project.members
      .filter(
        (user) =>
          (user.access === 'read' || user.access === 'edit') &&
          !authors.includes(user.user)
      )
      .map((user) => user.user);

    const guestUsers = project.guest_users || [];

    setAuthors(owners);
    setMembers([...members, ...guestUsers]);
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

  const onManageTeam = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'manageproject', props: {} },
    });
  };

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Review Authors and Citations</div>}
      headerActions={
        <>
          {canEdit && (
            <div className={styles.controls}>
              <>
                <Button type="link" onClick={onManageTeam}>
                  Manage Authors
                </Button>
              </>
            </div>
          )}
        </>
      }
    >
      {authors.length > 0 && project && (
        <Section contentLayoutName={'oneColumn'}>
          <Citations project={project} authors={authors} />

          {canEdit && (
            <>
              <ReorderUserList
                users={authors}
                onReorder={onReorder}
                onRemoveAuthor={onRemoveCoAuthor}
              />
              <ProjectMembersList
                members={members}
                onAddCoAuthor={onAddAuthor}
              />
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
