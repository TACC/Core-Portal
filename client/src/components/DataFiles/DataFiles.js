import React, { useEffect } from 'react';
import { Switch, Route, useRouteMatch, useHistory } from 'react-router-dom';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import './DataFiles.scss';

import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModals from './DataFilesModals/DataFilesModals';

const PrivateDataRedirect = () => {
  const systems = useSelector(state => state.systems, shallowEqual);
  const history = useHistory();
  useEffect(() => {
    history.push(`/workbench/data/tapis/private/${systems.private}/`);
  }, [systems]);
  return <></>;
};

const DataFilesSwitch = React.memo(() => {
  const dispatch = useDispatch();
  const { path } = useRouteMatch();
  return (
    <Switch>
      <Route
        path={`${path}/:api/:scheme/:system/:path*`}
        render={({ match: { params } }) => {
          dispatch({
            type: 'FETCH_FILES',
            payload: {
              ...params,
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
    <div className="data-files-wrapper">
      {/* row containing breadcrumbs and toolbar */}
      <div className="data-files-header row align-items-center justify-content-between">
        <DataFilesBreadcrumbs
          api={listingParams.api}
          scheme={listingParams.scheme}
          system={listingParams.system}
          path={listingParams.path || '/'}
          section="FilesListing"
          route
          className="data-files-breadcrumbs"
        />
        <DataFilesToolbar
          api={listingParams.api}
          scheme={listingParams.scheme}
        />
      </div>
      {/* row containing sidebar and listing pane */}
      <div className="data-files-items">
        <DataFilesSidebar />
        <div className="data-files-table">
          <DataFilesSwitch />
        </div>
      </div>
      <DataFilesModals />
    </div>
  );
};

export default DataFiles;
