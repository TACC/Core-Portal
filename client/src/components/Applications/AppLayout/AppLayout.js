import React from 'react';
import { Route, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner, Section } from '_common';
import './AppLayout.scss';
import AppBrowser from '../AppBrowser/AppBrowser';
import AppDetail, { AppPlaceholder } from '../AppForm/AppForm';

const AppsLayout = () => {
  const { params } = useRouteMatch();
  const { loading, categoryDict } = useSelector(
    state => ({
      loading: state.apps.loading,
      categoryDict: state.apps.categoryDict
    }),
    shallowEqual
  );
  const hasCategoryDict = Boolean(Object.keys(categoryDict).length);

  return (
    <>
      {loading && !hasCategoryDict ? (
        <LoadingSpinner />
      ) : (
        <>
          {hasCategoryDict && <AppBrowser />}
          {!params.appId && <AppPlaceholder apps={hasCategoryDict} />}
        </>
      )}
    </>
  );
};

const AppsHeader = appDict => {
  const { params } = useRouteMatch();
  const appMeta = appDict[params.appId];
  const path = appMeta ? ` / ${appMeta.value.definition.label}` : '';

  return `Applications ${path}`;
};

const AppsRoutes = () => {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const appDict = useSelector(state => state.apps.appDict, shallowEqual);
  const hasAppDict = Boolean(Object.keys(appDict).length);

  return (
    <Section
      routeName="APPLICATIONS"
      header={
        <Route path={`${path}/:appId?`}>
          <AppsHeader appDict={appDict} />
        </Route>
      }
      content={
        <>
          <Route path={`${path}/:appId?`}>
            <AppsLayout appDict={appDict} />
          </Route>
          {hasAppDict ? (
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
        </>
      }
      contentClassName="apps-content"
    />
  );
};

export default AppsRoutes;
