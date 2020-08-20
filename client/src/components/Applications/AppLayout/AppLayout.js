import React from 'react';
import { Route, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner } from '_common';
import './AppLayout.scss';
import AppBrowser from '../AppBrowser/AppBrowser';
import AppDetail, { AppPlaceholder } from '../AppForm/AppForm';

const AppsLayout = appDict => {
  const { params } = useRouteMatch();
  const { loading, categoryDict } = useSelector(
    state => ({
      loading: state.apps.loading,
      categoryDict: state.apps.categoryDict
    }),
    shallowEqual
  );
  const appMeta = appDict[params.appId];

  return (
    <>
      <div className="apps-header">
        <h5>
          Applications
          {appMeta ? ` / ${appMeta.value.definition.label}` : ''}
        </h5>
      </div>
      {loading && !Object.keys(categoryDict).length ? (
        <LoadingSpinner />
      ) : (
        <>
          {Boolean(Object.keys(categoryDict).length) && <AppBrowser />}
          {!params.appId && (
            <AppPlaceholder apps={Boolean(Object.keys(categoryDict).length)} />
          )}
        </>
      )}
    </>
  );
};

const AppsRoutes = () => {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const appDict = useSelector(state => state.apps.appDict, shallowEqual);

  return (
    <div id="apps-wrapper">
      <Route path={`${path}/:appId?`}>
        <AppsLayout appDict={appDict} />
      </Route>
      {Object.keys(appDict).length ? (
        <Route
          exact
          path={`${path}/:appId`}
          render={({ match: { params } }) => {
            dispatch({
              type: 'GET_APP',
              payload: {
                appMeta: appDict[params.appId],
                appId: params.appId
              }
            });
            return <AppDetail />;
          }}
        />
      ) : null}
    </div>
  );
};

export default AppsRoutes;
