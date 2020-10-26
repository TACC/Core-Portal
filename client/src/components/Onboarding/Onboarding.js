import React, { useEffect } from 'react';
import { Route, Switch, Redirect, useRouteMatch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { BrowserChecker } from '_common';
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
    <div>
      <BrowserChecker />
      <Switch>
        <Route path={`${path}/setup/:username?`} component={OnboardingUser} />
        <Route path={`${path}/admin`} component={OnboardingAdmin} />
        <Redirect from={`${path}`} to={`${path}/setup`} />
      </Switch>
    </div>
  );
}

export default Onboarding;
