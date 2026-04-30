import React, { useCallback, useEffect, useState } from 'react';
import { LoadingSpinner, SectionTableWrapper } from '_common';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Wizard from '_common/Wizard';
import styles from './DataFilesProjectPublish.module.scss';
import { fetchUtil } from 'utils/fetchUtil';
import * as ROUTES from '../../../../constants/routes';
import { ProjectDescriptionStep } from './DataFilesProjectPublishWizardSteps/ProjectDescription';
import { PublicationInstructionsStep } from './DataFilesProjectPublishWizardSteps/PublicationInstructions';
import { ReviewProjectStructureStep } from './DataFilesProjectPublishWizardSteps/ReviewProjectStructure';
import { ReviewAuthorsStep } from './DataFilesProjectPublishWizardSteps/ReviewAuthors';
import { SubmitPublicationRequestStep } from './DataFilesProjectPublishWizardSteps/SubmitPublicationRequest';

const DataFilesProjectPublish = ({ rootSystem, system }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { projectId, publication_requests } = useSelector(
    (state) => state.projects.metadata
  );
  const [authors, setAuthors] = useState([]);
  const [tree, setTree] = useState([]);

  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_METADATA',
      payload: system,
    });
  }, [system]);

  const { dynamicFormModal, previewModal, metadata } = useSelector((state) => ({
    dynamicFormModal: state.files.modals.dynamicform,
    previewModal: state.files.modals.preview,
    metadata: state.projects.metadata,
  }));

  const fetchTree = useCallback(async () => {
    if (projectId) {
      try {
        const response = await fetchUtil({
          url: `api/${portalName.toLowerCase()}/tree`,
          params: {
            project_id: projectId,
          },
        });
        setTree(response);
      } catch (error) {
        console.error('Error fetching tree data:', error);
        setTree([]);
      }
    }
  }, [portalName, projectId]);

  useEffect(() => {
    // Check if there is any PENDING publication request
    if (publication_requests?.some((request) => request.status === 'PENDING')) {
      // Navigate back to the previous location
      history.replace(
        location.state?.from || `${ROUTES.WORKBENCH}${ROUTES.DATA}`
      );
    }
  }, [publication_requests, history]);

  useEffect(() => {
    // workaround to get updated data after modal closes
    if (!dynamicFormModal || !previewModal) {
      fetchTree();
    }
  }, [dynamicFormModal, previewModal, fetchTree]);

  const handleAuthorsUpdate = (authors) => {
    setAuthors(authors);
  };

  const wizardSteps = [
    PublicationInstructionsStep(),
    ProjectDescriptionStep({ project: metadata }),
    ReviewProjectStructureStep({ projectTree: tree }),
    ReviewAuthorsStep({
      project: metadata,
      onAuthorsUpdate: handleAuthorsUpdate,
    }),
    SubmitPublicationRequestStep({
      callbackUrl: `${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}`,
    }),
  ];

  const formSubmit = (values) => {
    const data = {
      ...metadata,
      authors: authors,
    };

    if (values.formSubmitted) {
      dispatch({
        type: 'PROJECTS_CREATE_PUBLICATION_REQUEST',
        payload: data,
      });
    }
  };

  return (
    <>
      {metadata.loading ? (
        <LoadingSpinner />
      ) : (
        <SectionTableWrapper
          className={styles.root}
          header={
            <div className={styles.title}>
              Request Dataset Publication | {metadata.title}
            </div>
          }
          headerActions={
            <div className={styles.controls}>
              <>
                <Link
                  className="wb-link"
                  to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}`}
                >
                  Back to Dataset
                </Link>
              </>
            </div>
          }
        >
          <Wizard steps={wizardSteps} formSubmit={formSubmit} />
        </SectionTableWrapper>
      )}
    </>
  );
};

export default DataFilesProjectPublish;
