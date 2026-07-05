import React, { useEffect, useState } from 'react';
import {
  Button,
  SectionTableWrapper,
  Section,
} from '_common';
import { Citations } from '_common/Citations/Citations';
import styles from './DataFilesProjectPublishWizard.module.scss';
import ReorderUserList from '../../utils/ReorderUserList/ReorderUserList';
import ProjectMembersList from '../../utils/ProjectMembersList/ProjectMembersList';
import { useDispatch, useSelector } from 'react-redux';

const ReviewAuthors = ({ project, onAuthorsUpdate, isReviewProject = false }) => {
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
    const projectMembers = project.members || [];
    const guestUsers = project.guest_users || [];

    const initialAuthors = isReviewProject && project.authors.length > 0 ? project.authors : [
      ...projectMembers.map((member) => ({
        ...member.user,
        isOwner: member.access === 'owner',
      })),
      ...guestUsers,
    ];

    setAuthors(initialAuthors);
    setMembers([]);
    onAuthorsUpdate(initialAuthors);
  }, [project?.projectId]);

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

export const ReviewAuthorsStep = ({ project, onAuthorsUpdate, isReviewProject = false }) => ({
  id: 'project_authors',
  name: 'Review Authors and Citations',
  render: <ReviewAuthors project={project} onAuthorsUpdate={onAuthorsUpdate} isReviewProject={isReviewProject} />,
  initialValues: {},
});
