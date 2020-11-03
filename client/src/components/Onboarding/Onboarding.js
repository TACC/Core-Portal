import React from 'react';
import { Route, Switch, Redirect, useRouteMatch } from 'react-router-dom';
import OnboardingAdmin from './OnboardingAdmin';
import OnboardingUser from './OnboardingUser';

function Onboarding() {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/setup/:username?`} component={OnboardingUser} />
      <Route path={`${path}/admin`} component={OnboardingAdmin} />
      <Redirect from={`${path}`} to={`${path}/setup`} />
    </Switch>
  );
}

export default Onboarding;
