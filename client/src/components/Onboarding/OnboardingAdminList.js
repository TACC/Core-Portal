import React from 'react';
import { InfiniteScrollTable } from '_common';
import { Button } from 'reactstrap'
import { v4 as uuidv4 } from 'uuid';
import OnboardingActions from './OnboardingActions';
import './OnboardingAdminList.scss';
import './OnboardingAdminList.module.scss';

const OnboardingAdminListUser = ({ user }) => {
  return (
    <tr>
      <td>{`${user.firstName} ${user.lastName}`}</td>
      <td styleName="step-list">
        {user.steps.map(
          step => (
            <div key={step.step}>
              {step.displayName}
            </div>
          )
        )}
      </td>
      <td styleName="step-list">
        {user.steps.map(
          step => (
            <div>
              <OnboardingActions step={step} key={step.step}/>
            </div>
          )
        )}
      </td>
      <td styleName="step-list">
        {user.steps.map(
          step => (
            <div>
              <Button color="link"><h6>View Log</h6></Button>
            </div>            
          )
        )}
      </td>
    </tr>
  )
}

const OnboardingAdminList = ({ users }) => {
  return (
    <table styleName="root">
      <thead>
        <tr>
          <td>User</td>
          <td>Step</td>
          <td>Administrative Actions</td>
          <td>Log</td>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <OnboardingAdminListUser user={user} key={user.username}/>
        ))}
      </tbody>
    </table>
  );
};

export default OnboardingAdminList;
