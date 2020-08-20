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

import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModals from './DataFilesModals/DataFilesModals';
import DataFilesSearchbar from './DataFilesSearchbar/DataFilesSearchbar';

const PrivateDataRedirect = () => {
  const systems = useSelector(state => state.systems.systemList, shallowEqual);
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
        <DataFilesSidebar styleName="sidebar" />
        <div styleName="content">
          <DataFilesSearchbar
            styleName="content-toolbar"
            api={listingParams.api}
            scheme={listingParams.scheme}
            system={listingParams.system}
          />
          <div styleName="content-table">
            <DataFilesSwitch />
          </div>
        </div>
      </div>
      <DataFilesModals />
    </div>
  );
};

export default DataFiles;
