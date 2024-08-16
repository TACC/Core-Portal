import React, { useCallback, useEffect, useState } from 'react';
import { LoadingSpinner, SectionTableWrapper } from '_common';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Wizard from '_common/Wizard';
import styles from './DataFilesProjectReview.module.scss';
import { fetchUtil } from 'utils/fetchUtil';
import * as ROUTES from '../../../../constants/routes';
import { ProjectDescriptionStep } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ProjectDescription';
import { ReviewProjectStructureStep } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ReviewProjectStructure';
import { ReviewAuthorsStep } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ReviewAuthors';
import { SubmitPublicationReviewStep } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/SubmitPublicationReview';

const DataFilesProjectReview = ({ system }) => {
    const dispatch = useDispatch();
    const portalName = useSelector((state) => state.workbench.portalName);
    const { projectId } = useSelector((state) => state.projects.metadata);
    const [tree, setTree] = useState([]);

    useEffect(() => {
        dispatch({
            type: 'PROJECTS_GET_METADATA',
            payload: system,
        });
    }, [system]);

    const { metadata } = useSelector((state) => state.projects);

    const fetchTree = useCallback(async () => {
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
    }, [portalName, projectId]);

    useEffect(() => {
        fetchTree();
    }, [portalName, projectId, fetchTree]);

    const wizardSteps = [
        ProjectDescriptionStep({ project: metadata }),
        ReviewProjectStructureStep({ projectTree: tree }),
        ReviewAuthorsStep({ project: metadata, onAuthorsUpdate: () => {}}),
        SubmitPublicationReviewStep(),
    ]

    const formSubmit = (values) => {
        
    }

    return (
        <>
            {metadata.loading ? (
                <LoadingSpinner />
            ) : (
                <SectionTableWrapper
                className={styles.root}
                header={
                    <div className={styles.title}>
                    Review Publication Request | {metadata.title}
                    </div>
                }
                headerActions={
                    <div className={styles.controls}>
                    <>
                        <Link
                        className="wb-link"
                        to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${system}`}
                        >
                        Back to Project
                        </Link>
                    </>
                    </div>
                }
                >
                    <Wizard steps={wizardSteps} formSubmit={formSubmit} />
                </SectionTableWrapper>
            )}
        </>
    )
}

export default DataFilesProjectReview;