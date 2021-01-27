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

import './DataFiles.module.css';

import { Message, LoadingSpinner } from '_common';
import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModals from './DataFilesModals/DataFilesModals';
import DataFilesProjectsList from './DataFilesProjectsList/DataFilesProjectsList';
import DataFilesProjectFileListing from './DataFilesProjectFileListing/DataFilesProjectFileListing';

const PrivateDataRedirect = () => {
  const systems = useSelector(
    state => state.systems.storage.configuration,
    shallowEqual
  );
  const history = useHistory();
  useEffect(() => {
    if (systems.length === 0) return;
    history.push(`/workbench/data/tapis/private/${systems[0].system}/`);
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
            <DataFilesListing
              api={params.api}
              scheme={params.scheme}
              system={params.system}
              path={params.path || '/'}
            />
          );
        }}
      />
      <Route path={`${path}/tapis/projects`}>
        <DataFilesProjectsList />
      </Route>
      <Route path={`${path}`}>
        <PrivateDataRedirect />
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

  const readOnly =
    listingParams.scheme === 'projects' &&
    (listingParams.system === '' || !listingParams.system);

  if (error) {
    return (
      <Message type="warn" styleName="error">
        There was a problem retrieving your systems
      </Message>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div styleName="container">
      {/* row containing breadcrumbs and toolbar */}
      <div styleName="header">
        <DataFilesBreadcrumbs
          styleName="header-title"
          api={listingParams.api}
          scheme={listingParams.scheme}
          system={listingParams.system}
          path={listingParams.path || '/'}
          section="FilesListing"
          route
        />
        <DataFilesToolbar
          api={listingParams.api}
          scheme={listingParams.scheme}
        />
      </div>
      {/* row containing sidebar and listing pane */}
      <div styleName="items">
        <DataFilesSidebar styleName="sidebar" readOnly={readOnly} />
        <div styleName="content">
          <DataFilesSwitch />
        </div>
      </div>
      <DataFilesModals />
    </div>
  );
};

export default DataFiles;
