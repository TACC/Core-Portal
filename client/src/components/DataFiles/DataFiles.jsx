import React, { useEffect } from 'react';
import { Switch, Route, useRouteMatch, useHistory } from 'react-router-dom';
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

const DefaultSystemRedirect = () => {
  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );
  const history = useHistory();
  useEffect(() => {
    if (systems.length === 0) return;
    const defaultSystem = systems[0];

    let path = `/workbench/data/${defaultSystem.api}/${defaultSystem.scheme}`;

    if (defaultSystem.scheme === 'projects') {
      path += defaultSystem.system ? `/${defaultSystem.system}` : '/';
    } else {
      path += `/${defaultSystem.system}${defaultSystem.homeDir || ''}/`;
    }

    history.push(path);
  }, [systems]);
  return <></>;
};

const DataFilesSwitch = React.memo(() => {
  const { path } = useRouteMatch();

  const portalName = useSelector((state) => state.workbench.portalName);

  const { DataFilesProjectPublish, DataFilesProjectReview } =
    useAddonComponents({ portalName });

  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  return (
    <Switch>
      {DataFilesProjectPublish && (
        <Route
          path={`${path}/tapis/projects/:root_system/:system/publish`}
          render={({ match: { params } }) => {
            return (
              <SectionTableWrapper contentShouldScroll>
                <DataFilesProjectPublish
                  system={params.system}
                  rootSystem={params.root_system}
                />
              </SectionTableWrapper>
            );
          }}
        />
      )}
      {DataFilesProjectReview && (
        <Route
          path={`${path}/tapis/projects/:root_system/:system/review`}
          render={({ match: { params } }) => {
            return (
              <SectionTableWrapper contentShouldScroll>
                <DataFilesProjectReview
                  system={params.system}
                  rootSystem={params.root_system}
                />
              </SectionTableWrapper>
            );
          }}
        />
      )}
      <Route
        exact
        path={`${path}/tapis/projects/:system`}
        render={({ match: { params } }) => {
          const system = systems.find((s) => s.system === params.system);

          if (system.publicationProject) {
            return <DataFilesPublicationsList rootSystem={params.system} />;
          } else if (system.reviewProject) {
            return <DataFilesReviewProjectList rootSystem={params.system} />;
          }

          return <DataFilesProjectsList rootSystem={params.system} />;
        }}
      />
      <Route
        path={`${path}/tapis/projects/:root_system/:system/:path*`}
        render={({ match: { params } }) => {
          return (
            <DataFilesProjectFileListing
              rootSystem={params.root_system}
              system={params.system}
              path={params.path || '/'}
            />
          );
        }}
      />
      <Route
        path={`${path}/:api/:scheme/:system/:path*`}
        render={({ match: { params } }) => {
          return (
            <SectionTableWrapper className={styles['content']} manualContent>
              <DataFilesListing
                api={params.api}
                scheme={params.scheme}
                system={params.system}
                path={params.path || '/'}
              />
            </SectionTableWrapper>
          );
        }}
      />
      <Route path={`${path}`}>
        <DefaultSystemRedirect />
      </Route>
    </Switch>
  );
});

const DataFiles = () => {
  const { params: listingParams } = useFileListing('FilesListing');
  const { data: allSystems, loading, error } = useSystems();

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
  const { query: authenticatedUserQuery } = useSystemRole(
    projectId,
    authenticatedUser
  );

  const readOnly =
    listingParams.scheme === 'projects' &&
    (listingParams.system === '' ||
      !listingParams.system ||
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
