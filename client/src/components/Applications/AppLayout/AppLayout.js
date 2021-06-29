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
          <AppsHeader appDict={appDict} />
        </Route>
      }
      content={
        <>
          <Route path={`${path}/:appId?`}>
            <AppsLayout />
          </Route>
          {Object.keys(categoryDict).length ? (
            <Route
              exact
              path={`${path}/:appId`}
              render={({ match: { params } }) => {
                const appDef = appDict[params.appId];
                if (appDef && 'html' in appDef) {
                  dispatch({
                    type: 'LOAD_APP',
                    payload: { definition: appDict[params.appId] }
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
