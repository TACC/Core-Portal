import React, { useEffect, useState } from 'react';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DataFilesProjectFileListingAddon.module.scss';
import { useSelectedFiles, useSystems } from 'hooks/datafiles';
import useDrpDatasetModals from '../utils/hooks/useDrpDatasetModals';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../../../constants/routes';

const DataFilesProjectFileListingAddon = ({ rootSystem, system }) => {
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId } = useSelector((state) => state.projects.metadata);
  const { metadata } = useSelector((state) => state.projects);
  const { selectedFiles } = useSelectedFiles();
  const { isPublicationSystem, isReviewSystem } = useSystems();

  const dispatch = useDispatch();

  const {
    createSampleModal,
    createOriginDataModal,
    createAnalysisDataModal,
    createTreeModal,
    createPublicationAuthorsModal,
  } = useDrpDatasetModals(projectId, portalName);

  const createPublicationRequestModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'publicationRequest',
        props: { publicationRequests: metadata?.publication_requests },
      },
    });
  };

  const { canEditDataset, canRequestPublication, canReviewPublication } =
    useSelector((state) => {
      const { members } = state.projects.metadata;
      const { username } = state.authenticatedUser?.user ?? {};
      const currentUser = members.find(
        (member) => member.user?.username === username
      );

      if (!currentUser) {
        return {
          canEditDataset: false,
          canRequestPublication: false,
          canReviewPublication: false,
        };
      }

      const { access } = currentUser;
      const { is_review_project, publication_requests } =
        state.projects.metadata;

      let canReviewPublication = false;
      let canRequestPublication = access === 'owner';

      if (publication_requests?.length > 0) {
        const pendingRequest = publication_requests.find(
          (request) => request.status === 'PENDING'
        );

        if (pendingRequest) {
          canRequestPublication = false; // Prevent requesting publication if there is a pending request
          canReviewPublication =
            is_review_project &&
            pendingRequest.reviewers.some(
              (reviewer) => reviewer.username === username
            );
        }
      }

      return {
        canEditDataset: access === 'owner' || access === 'edit',
        canRequestPublication,
        canReviewPublication,
      };
    });

  return (
    <>
      {(isPublicationSystem(rootSystem) || isReviewSystem(rootSystem)) && (
        <>
          <Button
            type="link"
            onClick={() =>
              createPublicationAuthorsModal({ authors: metadata?.authors })
            }
          >
            View Authors
          </Button>
        </>
      )}
      {canEditDataset && (
        <>
          <span className={styles.separator}>|</span>
          {selectedFiles.length == 1 &&
          selectedFiles[0]?.metadata &&
          selectedFiles[0].metadata['data_type'] === 'sample' ? (
            <Button
              type="link"
              onClick={() =>
                createSampleModal('EDIT_SAMPLE_DATA', selectedFiles[0])
              }
            >
              Edit Sample Data
            </Button>
          ) : (
            <Button
              type="link"
              onClick={() => createSampleModal('ADD_SAMPLE_DATA')}
            >
              Add Sample Data
            </Button>
          )}
          <span className={styles.separator}>|</span>
          {selectedFiles.length == 1 &&
          selectedFiles[0]?.metadata &&
          selectedFiles[0].metadata['data_type'] === 'digital_dataset' ? (
            <Button
              type="link"
              onClick={() =>
                createOriginDataModal('EDIT_ORIGIN_DATASET', selectedFiles[0])
              }
            >
              Edit Digital Dataset
            </Button>
          ) : (
            <Button
              type="link"
              onClick={() => createOriginDataModal('ADD_ORIGIN_DATASET')}
            >
              Add Digital Dataset
            </Button>
          )}
          <span className={styles.separator}>|</span>
          {selectedFiles.length == 1 &&
          selectedFiles[0]?.metadata &&
          selectedFiles[0].metadata['data_type'] === 'analysis_data' ? (
            <Button
              type="link"
              onClick={() =>
                createAnalysisDataModal(
                  'EDIT_ANALYSIS_DATASET',
                  selectedFiles[0]
                )
              }
            >
              Edit Analysis Dataset
            </Button>
          ) : (
            <Button
              type="link"
              onClick={() => createAnalysisDataModal('ADD_ANALYSIS_DATASET')}
            >
              Add Analysis Dataset
            </Button>
          )}
        </>
      )}
      <>
        <span className={styles.separator}>|</span>
        <Button
          type="link"
          onClick={() => createTreeModal({ readOnly: !canEditDataset })}
        >
          View Project Tree
        </Button>
      </>
      {canRequestPublication && (
        <>
          <span className={styles.separator}>|</span>
          <Link
            className={`wb-link ${styles['link']}`}
            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}/publish`}
          >
            Request Publication
          </Link>
        </>
      )}
      {canReviewPublication && (
        <>
          <span className={styles.separator}>|</span>
          <Link
            className={`wb-link ${styles['link']}`}
            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}/review`}
          >
            Review Publication Request
          </Link>
        </>
      )}
      {metadata?.publication_requests?.length > 0 && (
        <>
          <span className={styles.separator}>|</span>
          <Button type="link" onClick={createPublicationRequestModal}>
            View Publication Requests
          </Button>
        </>
      )}
    </>
  );
};

export default DataFilesProjectFileListingAddon;
