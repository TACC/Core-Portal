import React from 'react';
import './OnboardingAdmin.module.scss';

const OnboardingAdminUser = ({ user }) => {
  return (
    <div>
      {`${user.firstName} ${user.lastName}`}
    </div>
  )
}

export default OnboardingAdminUser;