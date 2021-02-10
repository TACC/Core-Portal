import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OnboardingAdminList from './OnboardingAdminList';
import './OnboardingAdmin.module.scss';

const OnboardingAdmin = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: 'FETCH_ONBOARDING_ADMIN_LIST' });
  }, [dispatch]);

  const users = useSelector(state => state.onboarding.admin.users);
  return (
    <div styleName="container">
      <div styleName="container-header">
        <h5>Administrator Controls</h5>
      </div>
      <OnboardingAdminList users={users} />
    </div>
  );
};

export default OnboardingAdmin;
