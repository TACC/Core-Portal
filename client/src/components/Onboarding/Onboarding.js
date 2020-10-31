import React, { useEffect } from 'react';
import { Route, Switch, Redirect, useRouteMatch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { BrowserChecker } from '_common';
import Sidebar from '../Sidebar';
import OnboardingAdmin from './OnboardingAdmin';
import OnboardingUser from './OnboardingUser';

function Onboarding() {
  const dispatch = useDispatch();
  const { path } = useRouteMatch();

  useEffect(() => {
    dispatch({ type: 'FETCH_AUTHENTICATED_USER' });
    dispatch({ type: 'FETCH_NOTIFICATIONS' });
  }, []);

  return (
    <div className="workbench-wrapper">
      <BrowserChecker />
      <Sidebar disabled />
      <div className="workbench-content">
        <Switch>
          <Route path={`${path}/setup/:username?`} component={OnboardingUser} />
          <Route path={`${path}/admin`} component={OnboardingAdmin} />
          <Redirect from={`${path}`} to={`${path}/setup`} />
        </Switch>
      </div>
    </div>
  );
}

export default Onboarding;
