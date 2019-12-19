import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import Dashboard from '../Dashboard';
import Allocations from '../Allocations';
import Sidebar from '../Sidebar';
import * as ROUTES from '../../constants/routes';
import './Workbench.scss';

function Applications() {
  return <h2>Applications</h2>;
}

function DataFiles() {
  return <h2>Data Files</h2>;
}

function Publications() {
  return <h2>Publications</h2>;
}

function History() {
  return <h2>History</h2>;
}

function Workbench() {
  const match = useRouteMatch();

  return (
    <div className="workbench-wrapper">
      <Sidebar />
      <div className="workbench-content">
        <Switch>
          <Route path={`${match.path}${ROUTES.DASHBOARD}`}>
            <Dashboard />
          </Route>
          <Route path={`${match.path}${ROUTES.DATA}`}>
            <DataFiles />
          </Route>
          <Route path={`${match.path}${ROUTES.APPLICATIONS}`}>
            <Applications />
          </Route>
          <Route
            path={`${match.path}${ROUTES.ALLOCATIONS}`}
            component={Allocations}
          />
          <Route path={`${match.path}${ROUTES.PUBLICATIONS}`}>
            <Publications />
          </Route>
          <Route path={`${match.path}${ROUTES.HISTORY}`}>
            <History />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default Workbench;
