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

import { Section, SectionTable } from '_common';

import './DataFiles.module.css';
import './DataFiles.css';

import { SectionMessage, LoadingSpinner } from '_common';
import DataFilesToolbar from './DataFilesToolbar/DataFilesToolbar';
import DataFilesListing from './DataFilesListing/DataFilesListing';
import DataFilesSidebar from './DataFilesSidebar/DataFilesSidebar';
import DataFilesBreadcrumbs from './DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesSearchbar from './DataFilesSearchbar/DataFilesSearchbar';
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
            <SectionTable styleName="content" manualContent>
              <>
                <DataFilesSearchbar
                  api={params.api}
                  scheme={params.scheme}
                  system={params.system}
                  styleName="searchbar"
                />
                <div className="o-flex-item-table-wrap">
                  <DataFilesListing
                    api={params.api}
                    scheme={params.scheme}
                    system={params.system}
                    path={params.path || '/'}
                  />
                </div>
              </>
            </SectionTable>
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

  return (
    <Section
      bodyClassName="has-loaded-datafiles"
      routeName="DATA"
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
          <DataFilesSidebar styleName="sidebar" readOnly={readOnly} />
          <DataFilesSwitch />
          <DataFilesModals />
        </>
      }
      contentLayoutName="oneRow"
    />
  );
};

export default DataFiles;
