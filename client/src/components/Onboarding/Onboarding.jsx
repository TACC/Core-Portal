import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import OnboardingAdmin from './OnboardingAdmin';
import OnboardingUser from './OnboardingUser';

const path = `${ROUTES.WORKBENCH}${ROUTES.ONBOARDING}`;

function Onboarding() {
  return (
    <Routes>
      <Route path={`setup/:username?`} element={<OnboardingUser />} />
      <Route path={`admin`} element={<OnboardingAdmin />} />
      <Route index element={<Navigate to={`${path}/setup`} replace />} />
    </Routes>
  );
}

export default Onboarding;
