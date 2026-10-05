import React, { useEffect } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';

import './DataFiles.global.css';
import styles from './DataFiles.module.css';

import {
  Section,
  SectionTableWrapper,
  SectionMessage,
  LoadingSpinner,
} from '_common';
import {
  useFileListing,
  useSystems,
  useAddonComponents,
} from 'hooks/datafiles';
import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import CombinedBreadcrumbs from './CombinedBreadcrumbs/CombinedBreadcrumbs';
import DataFilesModals from './DataFilesModals/DataFilesModals';
import DataFilesProjectsList from './DataFilesProjectsList/DataFilesProjectsList';
import DataFilesProjectFileListing from './DataFilesProjectFileListing/DataFilesProjectFileListing';
import { useSystemRole } from './DataFilesProjectMembers/_cells/SystemRoleSelector';
import DataFilesPublicationsList from './DataFilesPublicationsList/DataFilesPublicationsList';
import DataFilesReviewProjectList from './DataFilesReviewProjectsList/DataFilesReviewProjectList';
import { getDecodedPath } from 'utils/datafilesUtil';

const DefaultSystemRedirect = () => {
  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );
  const navigate = useNavigate();
  useEffect(() => {
    if (systems.length === 0) return;
    const defaultSystem = systems[0];

    let path = `/workbench/data/${defaultSystem.api}/${defaultSystem.scheme}`;

    if (defaultSystem.scheme === 'projects') {
      path += defaultSystem.system ? `/${defaultSystem.system}` : '/';
    } else {
      path += `/${defaultSystem.system}${defaultSystem.homeDir || ''}/`;
    }

    navigate(path);
  }, [navigate, systems]);
  return <></>;
};

const ProjectPublishRoute = ({ Component }) => {
  const { root_system: rootSystem, system } = useParams();

  return (
    <SectionTableWrapper contentShouldScroll>
      <Component system={system} rootSystem={rootSystem} />
    </SectionTableWrapper>
  );
};

const ProjectRoute = ({ systems }) => {
  const { system: systemName } = useParams();
  const system = systems.find((item) => item.system === systemName);

  if (system.publicationProject) {
    return <DataFilesPublicationsList rootSystem={systemName} />;
  }
  if (system.reviewProject) {
    return <DataFilesReviewProjectList rootSystem={systemName} />;
  }

  return <DataFilesProjectsList rootSystem={systemName} />;
};

const ProjectFileRoute = () => {
  const { root_system: rootSystem, system, '*': filePath } = useParams();

  return (
    <DataFilesProjectFileListing
      rootSystem={rootSystem}
      system={system}
      path={getDecodedPath(filePath)}
    />
  );
};

const DataFileRoute = () => {
  const { api, scheme, system, '*': filePath } = useParams();

  return (
    <SectionTableWrapper className={styles['content']} manualContent>
      <DataFilesListing
        api={api}
        scheme={scheme}
        system={system}
        path={filePath || '/'}
      />
    </SectionTableWrapper>
  );
};

const DataFilesSwitch = React.memo(() => {
  const portalName = useSelector((state) => state.workbench.portalName);

  const { DataFilesProjectPublish, DataFilesProjectReview } =
    useAddonComponents({ portalName });

  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  return (
    <Routes>
      {DataFilesProjectPublish && (
        <Route
          path={`tapis/projects/:root_system/:system/publish`}
          element={<ProjectPublishRoute Component={DataFilesProjectPublish} />}
        />
      )}
      {DataFilesProjectReview && (
        <Route
          path={`tapis/projects/:root_system/:system/review`}
          element={<ProjectPublishRoute Component={DataFilesProjectReview} />}
        />
      )}
      <Route
        path={`tapis/projects/:system`}
        element={<ProjectRoute systems={systems} />}
      />
      <Route
        path={`tapis/projects/:root_system/:system/*`}
        element={<ProjectFileRoute />}
      />
      <Route path={`:api/:scheme/:system/*`} element={<DataFileRoute />} />
      <Route path={`*`} element={<DefaultSystemRedirect />} />
    </Routes>
  );
});

const DataFiles = () => {
  const { params: listingParams } = useFileListing('FilesListing');
  const {
    data: allSystems,
    loading,
    error,
    isRootProjectSystem,
  } = useSystems();

  const systems = allSystems.filter((s) => !s.hidden);
  const noPHISystem = useSelector(
    (state) => state.workbench.config.noPHISystem
  );

  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user.username
  );
  const projectId = useSelector((state) =>
    state.projects.metadata.projectId ? state.projects.metadata.projectId : ''
  );
  const isPublishedProject = useSelector(
    (state) => state.projects.metadata.is_published_project
  );
  const isReviewProject = useSelector(
    (state) => state.projects.metadata.is_review_project
  );
  const { query: authenticatedUserQuery } = useSystemRole(
    projectId,
    authenticatedUser
  );

  const readOnly =
    listingParams.scheme === 'projects' &&
    (isRootProjectSystem({ system: listingParams.system }) ||
      isPublishedProject ||
      isReviewProject ||
      authenticatedUserQuery?.data?.role === 'GUEST');

  if (error) {
    return (
      <div className={styles['error']}>
        <SectionMessage type="warning">
          There was a problem retrieving your systems
        </SectionMessage>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!systems.length) {
    return (
      <div className={styles['error']}>
        <SectionMessage type="warning">
          No storage systems enabled for this portal
        </SectionMessage>
      </div>
    );
  }

  return (
    <Section
      bodyClassName="has-loaded-datafiles"
      messageComponentName={
        listingParams.system === noPHISystem ? 'UNPROTECTED' : 'DATA'
      }
      header={
        <CombinedBreadcrumbs
          api={listingParams.api}
          scheme={listingParams.scheme}
          system={listingParams.system}
          path={listingParams.path || '/'}
          section="FilesListing"
          route
        />
      }
      headerActions={
        <DataFilesToolbar
          api={listingParams.api}
          scheme={listingParams.scheme}
        />
      }
      content={
        <>
          <DataFilesSidebar readOnly={readOnly} />
          <DataFilesSwitch />
          <DataFilesModals />
        </>
      }
    />
  );
};
export default DataFiles;
