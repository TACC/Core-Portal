import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSystems } from 'hooks/datafiles';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Workbench from './Workbench';
import * as ROUTES from '../../constants/routes';
import TicketStandaloneCreate from '../Tickets/TicketStandaloneCreate';
import PublicData from '../PublicData/PublicData';
import RequestAccess from '../RequestAccess/RequestAccess';
import GoogleDrivePrivacyPolicy from '../ManageAccount/GoogleDrivePrivacyPolicy';
import SiteSearch from '../SiteSearch';
import UserNewsBrowse from '../UserNews/UserNewsBrowse';
import UserNewsDetail from '../UserNews/UserNewsDetail';

function AppRouter() {
  const dispatch = useDispatch();
  const { fetchSystems } = useSystems();
  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user
  );
  const showUserNews = useSelector(
    (state) => state.workbench?.config?.showUserNews ?? false
  );
  const hasCustomSagas = useSelector(
    (state) => state.workbench.config.hasCustomSagas
  );
  const portalName = useSelector((state) => state.workbench.portalName);
  const [CustomRoutes, setCustomRoutes] = useState(null);

  // Resolve the portal's own routes from _custom/<portal>/CustomRoutes.jsx, so
  // any portal can register its own routes
  useEffect(() => {
    if (!portalName) {
      setCustomRoutes(null);
      return;
    }
    import(`../_custom/${portalName.toLowerCase()}/CustomRoutes.jsx`)
      .then((module) => setCustomRoutes(() => module.default))
      .catch(() => setCustomRoutes(null));
  }, [portalName]);

  useEffect(() => {
    dispatch({ type: 'FETCH_AUTHENTICATED_USER' });
    dispatch({ type: 'FETCH_WORKBENCH' });
    fetchSystems();
  }, []);

  useEffect(() => {
    if (authenticatedUser?.username) {
      dispatch({ type: 'FETCH_INTRO' });
      dispatch({ type: 'FETCH_CUSTOM_MESSAGES' });
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (hasCustomSagas) {
      dispatch({ type: 'START_CUSTOM_SAGA' });
    }
  }, [hasCustomSagas]);

  return (
    <Router>
      <Route path="/search/:filter?" component={SiteSearch} />
      <Route path={ROUTES.WORKBENCH} component={Workbench} />
      <Route path="/tickets/new" component={TicketStandaloneCreate} />
      <Route path="/public-data" component={PublicData} />
      {CustomRoutes && <CustomRoutes />}
      <Route path="/request-access" component={RequestAccess} />
      <Route
        path="/googledrive-privacy-policy"
        component={GoogleDrivePrivacyPolicy}
      />
      {showUserNews && (
        <Route exact path={ROUTES.USER_NEWS} component={UserNewsBrowse} />
      )}
      {showUserNews && (
        <Route path={`${ROUTES.USER_NEWS}/:id`} component={UserNewsDetail} />
      )}
    </Router>
  );
}

export default AppRouter;
