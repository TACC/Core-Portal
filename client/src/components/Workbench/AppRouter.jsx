import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSystems } from 'hooks/datafiles';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
      <Routes>
        <Route path="/search/:filter?" element={<SiteSearch />} />
        <Route path={`${ROUTES.WORKBENCH}/*`} element={<Workbench />} />
        <Route path="/tickets/new" element={<TicketStandaloneCreate />} />
        <Route path="/public-data/*" element={<PublicData />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route
          path="/googledrive-privacy-policy"
          element={<GoogleDrivePrivacyPolicy />}
        />
        {showUserNews && (
          <Route path={ROUTES.USER_NEWS} element={<UserNewsBrowse />} />
        )}
        {showUserNews && (
          <Route
            path={`${ROUTES.USER_NEWS}/:id`}
            element={<UserNewsDetail />}
          />
        )}
      </Routes>
      {/* Rendered as a sibling (not nested inside <Routes>) because each
          portal's CustomRoutes defines its own <Routes>/<Route> tree, and
          <Routes> only accepts <Route>/<Fragment> as direct children. */}
      {CustomRoutes && <CustomRoutes />}
    </Router>
  );
}

export default AppRouter;
