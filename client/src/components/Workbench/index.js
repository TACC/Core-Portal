import { hot } from 'react-hot-loader/root';
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Workbench from './Workbench';

function AppRouter() {
  return (
    <Router>
      <Route
        path="/accounts/profile"
        render={() => {
          return <div>Manage your account!</div>;
        }}
      />
      <Route path="/workbench" component={Workbench} />
    </Router>
  );
}

export default hot(AppRouter);
