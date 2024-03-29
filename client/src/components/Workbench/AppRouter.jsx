import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSystems } from 'hooks/datafiles';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Workbench from './Workbench';
import * as ROUTES from '../../constants/routes';
import TicketStandaloneCreate from '../Tickets/TicketStandaloneCreate';
import PublicData from '../PublicData/PublicData';
import RequestAccess from '../RequestAccess/RequestAccess';
import GoogleDrivePrivacyPolicy from '../ManageAccount/GoogleDrivePrivacyPolicy';
import SiteSearch from '../SiteSearch';

function AppRouter() {
  const dispatch = useDispatch();
  const { fetchSystems } = useSystems();
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user
  );

  useEffect(() => {
    dispatch({ type: 'FETCH_AUTHENTICATED_USER' });
    dispatch({ type: 'FETCH_WORKBENCH' });
    fetchSystems();
  }, []);

  useEffect(() => {
    if (authenticatedUser) {
      dispatch({ type: 'FETCH_INTRO' });
      dispatch({ type: 'FETCH_CUSTOM_MESSAGES' });
    }
  }, [authenticatedUser]);
  return (
    <Router>
      <Route path="/search/:filter?" component={SiteSearch} />
      <Route path={ROUTES.WORKBENCH} component={Workbench} />
      <Route path="/tickets/new" component={TicketStandaloneCreate} />
      <Route path="/public-data" component={PublicData} />
      <Route path="/request-access" component={RequestAccess} />
      <Route
        path="/googledrive-privacy-policy"
        component={GoogleDrivePrivacyPolicy}
      />
    </Router>
  );
}

export default AppRouter;
