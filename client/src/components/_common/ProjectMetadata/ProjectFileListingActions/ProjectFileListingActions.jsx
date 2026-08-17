import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useModal, useSystems } from 'hooks/datafiles';
import * as ROUTES from '../../../../constants/routes';
import styles from './ProjectFileListingActions.module.scss';

/**
 * Generic project file-listing toolbar: the publication actions any
 * publication-enabled portal shares (view authors, tree diagram, request /
 * review publication, view requests, download). A portal can inject its own
 * per-entity actions through the `datasetActions` slot.
 */
const ProjectFileListingActions = ({ rootSystem, system, datasetActions }) => {
  const dispatch = useDispatch();
  const { metadata } = useSelector((state) => state.projects);
  const { isPublicationSystem, isReviewSystem } = useSystems();
  const { toggle: toggleModal } = useModal();

  const createPublicationAuthorsModal = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'publicationAuthors',
        props: { authors: metadata?.authors },
      },
    });

  const createTreeModal = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'projectTree', props: { readOnly: !canEdit } },
    });

  const createPublicationRequestModal = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'publicationRequest',
        props: { publicationRequests: metadata?.publication_requests },
      },
    });

  const togglePublicationDownloadModal = () =>
    toggleModal({
      operation: 'publicationDownload',
      props: { projectId: metadata?.projectId, rootSystem },
    });

  const { canEdit, canRequestPublication, canReviewPublication } = useSelector(
    (state) => {
      const { members } = state.projects.metadata;
      const { username } = state.authenticatedUser?.user ?? {};
      const currentUser = members.find(
        (member) => member.user?.username === username
      );

      if (!currentUser) {
        return {
          canEdit: false,
          canRequestPublication: false,
          canReviewPublication: false,
        };
      }

      const { access } = currentUser;
      const canEdit = access === 'owner' || access === 'edit';
      const { is_review_project, publication_requests } =
        state.projects.metadata;

      let canReviewPublication = false;
      let canRequestPublication = access === 'owner';

      if (publication_requests?.length > 0) {
        const pendingRequest = publication_requests.find(
          (request) => request.status === 'PENDING'
        );

        if (pendingRequest) {
          // Prevent requesting publication if there is a pending request
          canRequestPublication = false;
          canReviewPublication =
            is_review_project &&
            pendingRequest.reviewers.some(
              (reviewer) => reviewer.username === username
            );
        }
      }

      return { canEdit, canRequestPublication, canReviewPublication };
    }
  );

  const projectPath = `${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}`;

  // Ordered toolbar actions
  const actions = [
    (isPublicationSystem(rootSystem) || isReviewSystem(rootSystem)) && (
      <Button type="link" onClick={createPublicationAuthorsModal}>
        View Authors
      </Button>
    ),
    datasetActions,
    <Button type="link" onClick={createTreeModal}>
      View Tree Diagram
    </Button>,
    canRequestPublication && (
      <Link className={`wb-link ${styles['link']}`} to={`${projectPath}/publish`}>
        Request Publication
      </Link>
    ),
    canReviewPublication && (
      <Link className={`wb-link ${styles['link']}`} to={`${projectPath}/review`}>
        Review Publication Request
      </Link>
    ),
    metadata?.publication_requests?.length > 0 && (
      <Button type="link" onClick={createPublicationRequestModal}>
        View Publication Requests
      </Button>
    ),
    isPublicationSystem(rootSystem) && (
      <Button type="link" onClick={togglePublicationDownloadModal}>
        Download Dataset
      </Button>
    ),
  ].filter(Boolean);

  return (
    <>
      {actions.map((action, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className={styles.separator}>|</span>}
          {action}
        </React.Fragment>
      ))}
    </>
  );
};

ProjectFileListingActions.propTypes = {
  rootSystem: PropTypes.string,
  system: PropTypes.string,
  datasetActions: PropTypes.node,
};

export default ProjectFileListingActions;
