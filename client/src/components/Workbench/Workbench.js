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
import WelcomeMessages from './WelcomeMessages';
import './Workbench.scss';

function Workbench() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  // showUIPatterns: Show some entries only in local development
  const { loading, setupComplete, showUIPatterns } = useSelector(
    state => ({
      loading: state.workbench.loading,
      setupComplete: state.workbench.setupComplete,
      showUIPatterns: state.workbench.config.debug
    }),
    shallowEqual
  );

  // Get systems and any other initial data we need from the backend
  useEffect(() => {
    dispatch({ type: 'FETCH_WORKBENCH' });
    dispatch({
      type: 'FETCH_NOTIFICATIONS',
      payload: {
        body: {
          eventTypes: ['job', 'interactive_session_ready']
        }
      }
    });

    if (setupComplete) {
      dispatch({ type: 'FETCH_SYSTEMS' });
      dispatch({ type: 'GET_ALLOCATIONS' });
      dispatch({ type: 'GET_APPS' });
      dispatch({ type: 'GET_APP_START' });
      dispatch({ type: 'GET_JOBS', params: { offset: 0 } });
    }
  }, [setupComplete]);

  return (
    <div className="workbench-wrapper">
      <NotificationToast />
      <Sidebar disabled={!setupComplete} showUIPatterns={showUIPatterns} />
      <div className="workbench-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <WelcomeMessages />
            {setupComplete ? (
              <Switch>
                <Route path={`${path}${ROUTES.DASHBOARD}`}>
                  <Dashboard />
                </Route>
                <Route
                  path={`${path}${ROUTES.ACCOUNT}`}
                  component={ManageAccount}
                />
                <Route path={`${path}${ROUTES.DATA}`}>
                  <DataFiles />
                </Route>
                <Route
                  path={`${path}${ROUTES.APPLICATIONS}`}
                  component={Applications}
                />
                <Route
                  path={`${path}${ROUTES.ALLOCATIONS}`}
                  component={Allocations}
                />
                <Route path={`${path}${ROUTES.HISTORY}`} component={History} />
                <Route
                  path={`${path}${ROUTES.ONBOARDING}`}
                  component={Onboarding}
                />
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
