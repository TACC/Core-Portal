import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './OnboardingAdmin.module.scss';
import { Button } from 'reactstrap'
import OnboardingStatus from './OnboardingStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { v4 as uuidv4 } from 'uuid';

const OnboardingApproveActions = ({ callback }) => {
  return (
    <div>
      <Button styleName="approve" onClick={() => callback('staff_approve')}>
        <FontAwesomeIcon icon={faCheck} />
        <>Approve</>
      </Button>
      <Button styleName="approve" onClick={() => callback('staff_deny')}>
        <FontAwesomeIcon icon={faTimes} />
        <>Deny</>
      </Button>
    </div>
  )
}

const OnboardingResetLinks = ({ callback }) => {
  return (
    <div styleName="reset">
      <Button color="link" styleName="action-link" onClick={() => callback('reset')}>
        Reset
      </Button>
      <>|</>
      <Button color="link" styleName="action-link" onClick={() => callback('complete')}>
        Skip
      </Button>
    </div>
  )
}

const OnboardingAdminListUser = ({ user }) => {
  const dispatch = useDispatch();
  const actionCallback = useCallback((step, username, action) => {
    /*
    dispatch({
      type: 'POST_ONBOARDING_ACTION',
      payload: {
        step,
        action,
        username
      }
    });
    */
  }, [dispatch]);
  return (
    <tr styleName="user">
      <td>
        <div styleName="name">
          {`${user.firstName} ${user.lastName}`}
        </div>
      </td>
      <td>
        {user.steps.map(
          step => (
            <div key={uuidv4()}>
              {step.displayName}
            </div>
          )
        )}
      </td>
      <td>
        {user.steps.map(
          step => (
            <div key={uuidv4()} styleName="status">
              <OnboardingStatus step={step} />
            </div>
          )
        )}
      </td>
      <td>
        {user.steps.map(
          step => (
            <div key={uuidv4()}>
              {
                /*step.state === 'staff_wait' &&*/
                <OnboardingApproveActions 
                  callback={(action) => actionCallback(step, user.username, action)}
                />
              }
            </div>
          )
        )}
      </td>
      <td>
        {user.steps.map(
          step => (
            <div key={uuidv4()}>
              <OnboardingResetLinks
                callback={(action) => actionCallback(step, user.username, action)}
              />
            </div>
          )
        )}
      </td>
      <td>
        {user.steps.map(
          step => (
            <div key={uuidv4()}>
              <Button color="link" styleName="action-link">View Log</Button>
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
          <th>User</th>
          <th>Step</th>
          <th>Status</th>
          <th>Administrative Actions</th>
          <th></th>
          <th>Log</th>
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
