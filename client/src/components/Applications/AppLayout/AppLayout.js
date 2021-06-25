import React from 'react';
import { Route, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner, Section } from '_common';
import './AppLayout.global.css';
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

  return (
    <>
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

const AppsHeader = categoryDict => {
  const { params } = useRouteMatch();
  const appMeta = Object.values(categoryDict.categoryDict)
    .flatMap(e => e)
    .find(car => car.appId === params.appId);
  const path = appMeta ? ` / ${appMeta.label}` : '';
  return `Applications ${path}`;
};

const AppsRoutes = () => {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const appDict = useSelector(state => state.apps.appDict, shallowEqual);
  const categoryDict = useSelector(
    state => state.apps.categoryDict,
    shallowEqual
  );

  return (
    <Section
      bodyClassName="has-loaded-applications"
      welcomeMessageName="APPLICATIONS"
      header={
        <Route path={`${path}/:appId?`}>
          <AppsHeader categoryDict={categoryDict} />
        </Route>
      }
      content={
        <>
          <Route path={`${path}/:appId?`}>
            <AppsLayout />
          </Route>
          {Object.keys(appDict).length ? (
            <Route
              exact
              path={`${path}/:appId`}
              render={({ match: { params } }) => {
                const appDef = appDict[params.appId];
                if (appDef && 'html' in appDef) {
                  dispatch({
                    type: 'LOAD_APP',
                    payload: appDict[params.appId]
                  });
                } else {
                  dispatch({
                    type: 'GET_APP',
                    payload: {
                      appId: params.appId
                    }
                  });
                }
                return <AppDetail />;
              }}
            />
          ) : null}
        </>
      }
      contentLayoutName="oneColumn"
      contentShouldScroll
    />
  );
};

export default AppsRoutes;
