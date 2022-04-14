import React, { useEffect } from 'react';
import { Route, Switch, useRouteMatch, Redirect } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner } from '_common';
import Dashboard from '../Dashboard';
import TicketCreateModal from '../Tickets/TicketCreateModal';
import ManageAccount from '../ManageAccount';
import Allocations from '../Allocations';
import Applications from '../Applications';
import UIPatterns from '../UIPatterns';
import Sidebar from '../Sidebar';
import DataFiles from '../DataFiles';
import History from '../History';
import Onboarding from '../Onboarding';
import * as ROUTES from '../../constants/routes';
import NotificationToast from '../Toasts';
import OnboardingAdmin from '../Onboarding/OnboardingAdmin';
import './Workbench.scss';

function Workbench() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  // showUIPatterns: Show some entries only in local development
  const {
    loading,
    setupComplete,
    showUIPatterns,
    isStaff,
    hideApps,
    hideDataFiles,
  } = useSelector(
    (state) => ({
      loading: state.workbench.loading,
      setupComplete: state.workbench.setupComplete,
      showUIPatterns: state.workbench.config.debug,
      isStaff:
        state.authenticatedUser.user && state.authenticatedUser.user.isStaff,
      hideApps: state.workbench.config.hideApps,
      hideDataFiles: state.workbench.config.hideDataFiles,
    }),
    shallowEqual
  );

  // Get systems and any other initial data we need from the backend
  useEffect(() => {
    dispatch({
      type: 'FETCH_NOTIFICATIONS',
      payload: {
        body: {
          eventTypes: ['job', 'interactive_session_ready'],
        },
      },
    });

    if (setupComplete) {
      dispatch({ type: 'GET_ALLOCATIONS' });
      dispatch({ type: 'GET_APPS' });
      dispatch({ type: 'GET_APP_START' });
      dispatch({ type: 'GET_JOBS', params: { offset: 0 } });
      dispatch({ type: 'PROJECTS_GET_LISTING' });
    }
  }, [setupComplete]);

  return (
    <div className="workbench-wrapper">
      <NotificationToast />
      <Sidebar
        disabled={!setupComplete}
        showUIPatterns={showUIPatterns}
        loading={loading}
      />
      <div className="workbench-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {setupComplete ? (
              <Switch>
                <Route path={`${path}${ROUTES.DASHBOARD}`}>
                  <Dashboard />
                </Route>
                <Route
                  path={`${path}${ROUTES.ACCOUNT}`}
                  component={ManageAccount}
                />
                {!hideDataFiles && (
                  <Route path={`${path}${ROUTES.DATA}`}>
                    <DataFiles />
                  </Route>
                )}
                {!hideApps && (
                  <Route
                    path={`${path}${ROUTES.APPLICATIONS}`}
                    component={Applications}
                  />
                )}
                <Route
                  path={`${path}${ROUTES.ALLOCATIONS}`}
                  component={Allocations}
                />
                {!hideApps && (
                  <Route
                    path={`${path}${ROUTES.HISTORY}`}
                    component={History}
                  />
                )}
                <Route
                  path={`${path}${ROUTES.ONBOARDING}`}
                  component={Onboarding}
                />
                {isStaff && (
                  <Route
                    path={`${path}${ROUTES.ONBOARDINGADMIN}`}
                    component={OnboardingAdmin}
                  />
                )}
                {showUIPatterns && (
                  <Route path={`${path}${ROUTES.UI}`} component={UIPatterns} />
                )}
                <Redirect from={`${path}`} to={`${path}${ROUTES.DASHBOARD}`} />
              </Switch>
            ) : (
              <Switch>
                <Route
                  path={`${path}${ROUTES.ONBOARDING}`}
                  component={Onboarding}
                />
                <Redirect
                  from={`${path}`}
                  to={`${path}${ROUTES.ONBOARDING}/setup/`}
                />
              </Switch>
            )}
          </>
        )}
      </div>
      <TicketCreateModal /* Top level modals */ />
    </div>
  );
}

export default Workbench;
