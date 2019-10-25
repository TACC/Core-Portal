import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Workbench from './workbench'

function AppRouter() {
  return (
    <Router>
      <div>
        <Switch>
          <Route
            path='/workbench'
            render={Workbench}
            // render={(props) => <Workbench {...props} />}
          />
        </Switch>
      </div>
    </Router>
  );
}

export default AppRouter;
