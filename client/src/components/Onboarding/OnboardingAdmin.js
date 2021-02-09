import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OnboardingAdminUser from './OnboardingAdminUser';
import './OnboardingAdmin.module.scss';


const OnboardingAdminList = ({ users }) => {
  return (
    <>
      {
        users.map(
          user => (
            <OnboardingAdminUser user={user} />
          )
        )
      }
    </>
  )
}

const OnboardingAdmin = () => {
  const dispatch = useDispatch();
  
  useEffect(
    () => {
      dispatch({ type: "FETCH_ONBOARDING_ADMIN_LIST" });
    },
    [ dispatch ]
  )

  const users = useSelector(state => state.onboarding.admin.users);
  return (
    <div styleName="container">
      <div styleName="container-header">
        <h5>Administrator Controls</h5>
      </div>
      <OnboardingAdminList users={users}/>
    </div>
  );
}

export default OnboardingAdmin;
