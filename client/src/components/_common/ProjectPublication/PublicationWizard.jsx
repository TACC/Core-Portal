import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner, SectionTableWrapper } from '_common';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Wizard from '_common/Wizard';
import { useProjectTree } from 'hooks/datafiles';
import * as ROUTES from '../../../constants/routes';
import styles from './PublicationWizard.module.scss';

/**
 * Generic publish/review flow: fetches the project metadata and tree, renders a
 * Wizard of the steps a portal supplies, and hands submission back to the
 * portal. `renderSteps` receives the fetched metadata/tree so a portal can
 * assemble whatever steps (and per-step props) it needs.
 */
const PublicationWizard = ({
  system,
  rootSystem,
  title,
  redirectOnPending = false,
  renderSteps,
  onSubmit,
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const metadata = useSelector((state) => state.projects.metadata);
  const { projectId, publication_requests } = metadata;
  const [authors, setAuthors] = useState([]);
  const { data: tree = [] } = useProjectTree(projectId);

  useEffect(() => {
    dispatch({ type: 'PROJECTS_GET_METADATA', payload: system });
  }, [system]);

  useEffect(() => {
    if (
      redirectOnPending &&
      publication_requests?.some((request) => request.status === 'PENDING')
    ) {
      history.replace(
        location.state?.from || `${ROUTES.WORKBENCH}${ROUTES.DATA}`
      );
    }
  }, [redirectOnPending, publication_requests, history]);

  const steps = renderSteps({ metadata, tree, onAuthorsUpdate: setAuthors });

  const formSubmit = (values) => onSubmit(values, { metadata, authors });

  return (
    <>
      {metadata.loading ? (
        <LoadingSpinner />
      ) : (
        <SectionTableWrapper
          className={styles.root}
          header={<div className={styles.title}>{title}</div>}
          headerActions={
            <div className={styles.controls}>
              <Link
                className="wb-link"
                to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}`}
              >
                Back to Dataset
              </Link>
            </div>
          }
        >
          <Wizard steps={steps} formSubmit={formSubmit} />
        </SectionTableWrapper>
      )}
    </>
  );
};

PublicationWizard.propTypes = {
  system: PropTypes.string,
  rootSystem: PropTypes.string,
  title: PropTypes.string,
  redirectOnPending: PropTypes.bool,
  renderSteps: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default PublicationWizard;
