import { hot } from 'react-hot-loader/root';
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Workbench from './Workbench';
import ManageAccount from '../ManageAccount';
import Onboarding from '../Onboarding';
import * as ROUTES from '../../constants/routes';
import TicketStandaloneCreate from '../Tickets/TicketStandaloneCreate';

function AppRouter() {
  return (
    <Router>
      <Route path={ROUTES.WORKBENCH} component={Workbench} />
      <Route path={ROUTES.ONBOARDING} component={Onboarding} />
      <Route path="/tickets/new" component={TicketStandaloneCreate} />
      <Route path="/accounts/profile" component={ManageAccount} />
    </Router>
  );
}

export default hot(AppRouter);
