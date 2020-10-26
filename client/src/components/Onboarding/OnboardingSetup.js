import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

function OnboardingSetup() {
  const dispatch = useDispatch();
  const onboardingUser = useSelector(state => state.onboarding.onboardingAdminIndividualUser);


  return <div>{`${onboardingUser}`}</div>;
}

export default OnboardingSetup;
