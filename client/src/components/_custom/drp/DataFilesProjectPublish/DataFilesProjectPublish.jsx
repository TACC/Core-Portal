import React, { useEffect, useState } from 'react';
import { SectionTableWrapper } from '_common';
import { Link, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Wizard from '_common/Wizard';
import styles from './DataFilesProjectPublish.module.scss';
import { fetchUtil } from 'utils/fetchUtil';
import * as ROUTES from '../../../../constants/routes';
import ProjectDescription from './DataFilesProjectPublishWizardSteps/ProjectDescription';
import PublicationInstructions from './DataFilesProjectPublishWizardSteps/PublicationInstructions';
import ReviewProjectStructure from './DataFilesProjectPublishWizardSteps/ReviewProjectStructure';
import ReviewAuthors from './DataFilesProjectPublishWizardSteps/ReviewAuthors';

const DataFilesProjectPublish = ({ system, path, api, scheme }) => {
  const portalName = 'drp';
  const projectId = 'CEPV3-DEV-1133';

  const getTree = async (projectId, portalName) => {
    const response = await fetchUtil({
      url: `api/${portalName.toLowerCase()}/tree`,
      params: {
        project_id: projectId,
      },
    });

    return response;
  };

  const [tree, setTree] = useState([]);

  useEffect(async () => {
    const response = await getTree(projectId, portalName);
    setTree(response);
  }, [projectId, portalName]);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_METADATA',
      payload: system,
    });
  }, [system]);

  const metadata = useSelector((state) => state.projects.metadata);

  const formSubmit = (values) => {
    console.log('DataFilesProjectPublish: formSubmit: ', values);
  };

  console.log('DataFilesProjectPublish: metadata: ', metadata);

  const wizardSteps = [
    {
      id: 'publication_instructions',
      name: 'Publication Instructions',
      render: <PublicationInstructions />,
      initialValues: {},
    },
    {
      id: 'project_description',
      name: 'Project Description',
      render: <ProjectDescription project={metadata} />,
      initialValues: {},
    },
    {
      id: 'project_structure',
      name: 'Review Project Structure',
      render: (
        <ReviewProjectStructure
          projectTree={tree}
        />
      ),
      initialValues: {},
    },
    {
      id: 'project_authors',
      name: 'Review Authors and Citations',
      render: <ReviewAuthors project={metadata} />,
      initialValues: {},
    },
  ];

  // do the wizard now

  return (
    <SectionTableWrapper
      className={styles.root}
      header={
        <div className={styles.title}>
          Request Project Publication | {metadata.title}
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
  );
};

export default DataFilesProjectPublish;
