import React from 'react';
import {
  BrowserRouter as Route,
  Switch,
  useRouteMatch
} from 'react-router-dom';
import Dashboard from '../../components/dashboard';
import Allocations from '../../components/allocations';
import Sidebar from '../../components/sidebar';

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
          <Route path={`${match.path}/dashboard`}>
            <Dashboard />
          </Route>
          <Route path={`${match.path}/data`}>
            <DataFiles />
          </Route>
          <Route path={`${match.path}/applications`}>
            <Applications />
          </Route>
          <Route path={`${match.path}/allocations`}>
            <Allocations />
          </Route>
          <Route path={`${match.path}/publications`}>
            <Publications />
          </Route>
          <Route path={`${match.path}/history`}>
            <History />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default Workbench;
