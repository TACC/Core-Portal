import React, { useEffect } from 'react';
import { Route, Switch, useRouteMatch, Redirect } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Dashboard from '../Dashboard';
import Allocations from '../Allocations';
import Applications from '../Applications';
import UIPatterns from '../UIPatterns';
import Sidebar from '../Sidebar';
import DataFiles from '../DataFiles';
import History from '../History';
import * as ROUTES from '../../constants/routes';
import NotificationToast from '../Toasts';
import './Workbench.scss';

function Workbench() {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  // Show some entries only in local development
  const isDebug = useSelector(state =>
    state.workbench.status ? state.workbench.status.debug : false
  );
  const showUIPatterns = isDebug;
  // Get systems and any other initial data we need from the backend
  useEffect(() => {
    dispatch({ type: 'FETCH_SYSTEMS' });
    dispatch({ type: 'FETCH_AUTHENTICATED_USER' });
    dispatch({ type: 'FETCH_WORKBENCH' });
    dispatch({ type: 'GET_ALLOCATIONS' });
    dispatch({ type: 'GET_APPS' });
    dispatch({ type: 'GET_APP_START' });
    dispatch({ type: 'GET_JOBS', params: { offset: 0, limit: 20 } });
    dispatch({ type: 'FETCH_NOTIFICATIONS' });
  }, []);

  return (
    <div className="workbench-wrapper">
      <NotificationToast />
      <Sidebar />
      <div className="workbench-content">
        <Switch>
          <Route path={`${path}${ROUTES.DASHBOARD}`}>
            <Dashboard />
          </Route>
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
          {showUIPatterns && (
            <Route path={`${path}${ROUTES.UI}`} component={UIPatterns} />
          )}
          <Redirect from={`${path}`} to={`${path}${ROUTES.DASHBOARD}`} />
        </Switch>
      </div>
    </div>
  );
}

export default Workbench;
