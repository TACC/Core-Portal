import { hot } from 'react-hot-loader/root';
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Workbench from './Workbench';
import * as ROUTES from '../../constants/routes';
import TicketStandaloneCreate from '../Tickets/TicketStandaloneCreate';

function AppRouter() {
  return (
    <Router>
      <Route path={ROUTES.WORKBENCH} component={Workbench} />
      <Route path="/tickets/new" component={TicketStandaloneCreate} />
    </Router>
  );
}

export default hot(AppRouter);
