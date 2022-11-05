import React from 'react';
import { Route, useRouteMatch, useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner, Section, SectionMessage } from '_common';
import './AppLayout.global.css';
import AppBrowser from '../AppBrowser/AppBrowser';
import { AppDetail, AppPlaceholder } from '../AppForm/AppForm';

export const AppsLayout = () => {
  const { params } = useRouteMatch();
  const { loading, categoryDict, error } = useSelector(
    (state) => ({
      loading: state.apps.loading,
      error: state.apps.error,
      categoryDict: state.apps.categoryDict,
    }),
    shallowEqual
  );
  if (error.isError) {
    return (
      <div id="appDetail-wrapper" className="has-message  appDetail-error">
        <SectionMessage type="warning">Something went wrong.</SectionMessage>
      </div>
    );
  }
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

const AppsHeader = (categoryDict) => {
  const { params } = useRouteMatch();
  const appMeta = Object.values(categoryDict.categoryDict)
    .flatMap((e) => e)
    .find((app) => app.appId === params.appId);
  const path = appMeta ? ` / ${appMeta.label}` : '';
  return `Applications ${path}`;
};

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const AppsRoutes = () => {
  const query = useQuery();
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const htmlDict = useSelector((state) => state.apps.htmlDict, shallowEqual);
  const categoryDict = useSelector(
    (state) => state.apps.categoryDict,
    shallowEqual
  );

  return (
    <Section
      bodyClassName="has-loaded-applications"
      messageComponentName="APPLICATIONS"
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
          {Object.keys(categoryDict).length ? (
            <Route
              exact
              path={`${path}/:appId`}
              render={({ match: { params } }) => {
                const appDef = htmlDict[params.appId];
                if (appDef && 'html' in appDef) {
                  dispatch({
                    type: 'LOAD_APP',
                    payload: { definition: htmlDict[params.appId] },
                  });
                } else {
                  dispatch({
                    type: 'GET_APP',
                    payload: {
                      appId: params.appId,
                      appVersion: query.get("appVersion")
                    },
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
