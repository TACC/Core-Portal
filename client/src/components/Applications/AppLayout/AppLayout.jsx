import React from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner, Section, SectionMessage } from '_common';
import './AppLayout.global.css';
import AppBrowser from '../AppBrowser/AppBrowser';
import { AppDetail, AppPlaceholder } from '../AppForm/AppForm';

export const AppsLayout = () => {
  const params = useParams();
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
  const params = useParams();
  const query = useQuery();
  const appVersion = query.get('appVersion');
  const appMeta = Object.values(categoryDict.categoryDict)
    .flatMap((e) => e)
    .find(
      (app) =>
        app.appId === params.appId &&
        (!appVersion || app.version === appVersion)
    );
  const path = appMeta ? ` / ${appMeta.label || appMeta.appId}` : '';
  return `Applications ${path}`;
};

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const AppsRoutes = () => {
  const query = useQuery();
  const dispatch = useDispatch();
  const htmlDict = useSelector((state) => state.apps.htmlDict, shallowEqual);
  const categoryDict = useSelector(
    (state) => state.apps.categoryDict,
    shallowEqual
  );

  return (
    <Routes>
      <Route
        path=":appId?"
        element={
          <Section
            bodyClassName="has-loaded-applications"
            messageComponentName="APPLICATIONS"
            header={<AppsHeader categoryDict={categoryDict} />}
            content={
              <>
                <AppsLayout />
                {Object.keys(categoryDict).length ? (
                  <AppDetailRoute
                    htmlDict={htmlDict}
                    query={query}
                    dispatch={dispatch}
                  />
                ) : null}
              </>
            }
            contentLayoutName="oneColumn"
            contentShouldScroll
          />
        }
      />
    </Routes>
  );
};

const AppDetailRoute = ({ htmlDict, query, dispatch }) => {
  const { appId } = useParams();
  if (!appId) return null;

  const appDef = htmlDict[appId];

  if (appDef && 'html' in appDef) {
    dispatch({
      type: 'LOAD_APP',
      payload: { definition: appDef },
    });
  } else {
    dispatch({
      type: 'GET_APP',
      payload: {
        appId,
        appVersion: query.get('appVersion'),
      },
    });
  }

  return <AppDetail />;
};

export default AppsRoutes;
