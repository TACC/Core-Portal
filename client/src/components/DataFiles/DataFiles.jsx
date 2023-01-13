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
import { useFileListing, useSystems } from 'hooks/datafiles';
import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModals from './DataFilesModals/DataFilesModals';
import DataFilesProjectsList from './DataFilesProjectsList/DataFilesProjectsList';
import DataFilesProjectFileListing from './DataFilesProjectFileListing/DataFilesProjectFileListing';
import { useSystemRole } from './DataFilesProjectMembers/_cells/SystemRoleSelector';

const DefaultSystemRedirect = () => {
  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );
  const history = useHistory();
  useEffect(() => {
    if (systems.length === 0) return;
    const defaultSystem = systems[0];
    history.push(
      `/workbench/data/${defaultSystem.api}/${defaultSystem.scheme}/${
        defaultSystem.scheme === 'projects'
          ? ''
          : `${defaultSystem.system}${defaultSystem.homeDir || ''}/`
      }`
    );
  }, [systems]);
  return <></>;
};

const DataFilesSwitch = React.memo(() => {
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route
        path={`${path}/tapis/projects/:system/:path*`}
        render={({ match: { params } }) => {
          return (
            <DataFilesProjectFileListing
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
      <Route path={`${path}/tapis/projects`}>
        <DataFilesProjectsList />
      </Route>
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
        <DataFilesBreadcrumbs
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
