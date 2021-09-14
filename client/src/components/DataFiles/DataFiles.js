import React, { useEffect } from 'react';
import {
  Switch,
  Route,
  useRouteMatch,
  useHistory,
  useLocation
} from 'react-router-dom';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { parse } from 'query-string';

import './DataFiles.global.css';
import './DataFiles.module.css';

import {
  Section,
  SectionTableWrapper,
  SectionMessage,
  LoadingSpinner
} from '_common';
import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModals from './DataFilesModals/DataFilesModals';
import DataFilesProjectsList from './DataFilesProjectsList/DataFilesProjectsList';
import DataFilesProjectFileListing from './DataFilesProjectFileListing/DataFilesProjectFileListing';

const DefaultSystemRedirect = () => {
  const systems = useSelector(
    state => state.systems.storage.configuration,
    shallowEqual
  );
  const history = useHistory();
  useEffect(() => {
    if (systems.length === 0) return;
    const defaultSystem = systems[0];
    history.push(
      `/workbench/data/${defaultSystem.api}/${defaultSystem.scheme}/${
        defaultSystem.scheme === 'projects' ? '' : `${defaultSystem.system}/`
      }`
    );
  }, [systems]);
  return <></>;
};

const DataFilesSwitch = React.memo(() => {
  const dispatch = useDispatch();
  const { path } = useRouteMatch();
  const queryString = parse(useLocation().search).query_string;
  return (
    <Switch>
      <Route
        path={`${path}/tapis/projects/:system/:path*`}
        render={({ match: { params } }) => {
          dispatch({
            type: 'FETCH_FILES',
            payload: {
              ...params,
              api: 'tapis',
              scheme: 'projects',
              queryString,
              section: 'FilesListing'
            }
          });
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
          dispatch({
            type: 'FETCH_FILES',
            payload: {
              ...params,
              queryString,
              section: 'FilesListing'
            }
          });
          return (
            <SectionTableWrapper styleName="content" manualContent>
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
  const listingParams = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const loading = useSelector(state => state.systems.storage.loading);
  const error = useSelector(state => state.systems.storage.error);
  const systems = useSelector(state => state.systems.storage.configuration);

  const readOnly =
    listingParams.scheme === 'projects' &&
    (listingParams.system === '' || !listingParams.system);

  if (error) {
    return (
      <div styleName="error">
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
      <div styleName="error">
        <SectionMessage type="warning">
          No storage systems enabled for this portal
        </SectionMessage>
      </div>
    );
  }

  return (
    <Section
      bodyClassName="has-loaded-datafiles"
      introMessageName="DATA"
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
