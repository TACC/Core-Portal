import { hot } from 'react-hot-loader/root';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import getCMSSettings from 'utils/cmsSettings';

import Workbench from './Workbench';
import * as ROUTES from '../../constants/routes';
import TicketStandaloneCreate from '../Tickets/TicketStandaloneCreate';
import PublicData from '../PublicData/PublicData';
import GoogleDrivePrivacyPolicy from '../ManageAccount/GoogleDrivePrivacyPolicy/GoogleDrivePrivacyPolicy';
import SiteSearch from '../SiteSearch';

function AppRouter() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'FETCH_WELCOME' });
    dispatch({ type: 'FETCH_AUTHENTICATED_USER' });
  }, []);

  const cmsSettings = getCMSSettings();
  const { themeClassName } = cmsSettings;
  useEffect(() => {
    const root = document.documentElement;

    if (themeClassName) root.classList.add(themeClassName);

    return function cleanup() {
      if (themeClassName) root.documentElement.classList.remove(themeClassName);
    };
  }, [themeClassName]);

  return (
    <Router>
      <Route path="/search/:filter?" component={SiteSearch} />
      <Route path={ROUTES.WORKBENCH} component={Workbench} />
      <Route path="/tickets/new" component={TicketStandaloneCreate} />
      <Route path="/public-data" component={PublicData} />
      <Route
        path="/googledrive-privacy-policy"
        component={GoogleDrivePrivacyPolicy}
      />
    </Router>
  );
}

export default hot(AppRouter);
