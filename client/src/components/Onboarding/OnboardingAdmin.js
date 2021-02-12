import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingSpinner, Message } from '_common';
import './OnboardingAdmin.module.scss';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import { onboardingUserPropType } from './OnboardingPropTypes';
import OnboardingStatus from './OnboardingStatus';

const OnboardingApproveActions = ({ callback }) => {
  return (
    <div styleName="approve-container">
      <Button
        className="c-button--secondary"
        styleName="approve"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('staff_approve')}
      >
        <FontAwesomeIcon icon={faCheck} />
        <>Approve</>
      </Button>
      <Button
        className="c-button--secondary"
        styleName="approve"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('staff_deny')}
      >
        <FontAwesomeIcon icon={faTimes} />
        <>Deny</>
      </Button>
    </div>
  );
};

OnboardingApproveActions.propTypes = {
  callback: PropTypes.func.isRequired
};

const OnboardingResetLinks = ({ callback }) => {
  return (
    <div styleName="reset">
      <Button
        color="link"
        styleName="action-link"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('reset')}
      >
        Reset
      </Button>
      <>|</>
      <Button
        color="link"
        styleName="action-link"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('complete')}
      >
        Skip
      </Button>
    </div>
  );
};

OnboardingResetLinks.propTypes = {
  callback: PropTypes.func.isRequired
};

const OnboardingAdminListUser = ({ user }) => {
  const dispatch = useDispatch();
  const actionCallback = useCallback(
    (step, username, action) => {
      dispatch({
        type: 'POST_ONBOARDING_ACTION',
        payload: {
          step,
          action,
          username
        }
      });
    },
    [dispatch]
  );
  return (
    <tr styleName="user">
      <td>
        <div styleName="name">{`${user.firstName} ${user.lastName}`}</div>
      </td>
      <td>
        {user.steps.map(step => (
          <div
            key={uuidv4()}
            styleName={step.state === 'staffwait' ? 'staffwait' : ''}
          >
            {step.displayName}
          </div>
        ))}
      </td>
      <td>
        {user.steps.map(step => (
          <div
            key={uuidv4()}
            styleName={`status ${
              step.state === 'staffwait' ? 'staffwait' : ''
            }`}
          >
            <OnboardingStatus step={step} />
          </div>
        ))}
      </td>
      <td>
        {user.steps.map(step => (
          <div
            key={uuidv4()}
            styleName={step.state === 'staffwait' ? 'staffwait' : ''}
          >
            {step.state === 'staffwait' && (
              <OnboardingApproveActions
                callback={action =>
                  actionCallback(step.step, user.username, action)
                }
              />
            )}
          </div>
        ))}
      </td>
      <td>
        {user.steps.map(step => (
          <div
            key={uuidv4()}
            styleName={step.state === 'staffwait' ? 'staffwait' : ''}
          >
            <OnboardingResetLinks
              callback={action =>
                actionCallback(step.step, user.username, action)
              }
            />
          </div>
        ))}
      </td>
      <td>
        {user.steps.map(step => (
          <div
            key={uuidv4()}
            styleName={step.state === 'staffwait' ? 'staffwait' : ''}
          >
            <Button color="link" styleName="action-link">
              View Log
            </Button>
          </div>
        ))}
      </td>
    </tr>
  );
};

OnboardingAdminListUser.propTypes = {
  user: onboardingUserPropType.isRequired
};

const OnboardingAdminList = ({ users }) => {
  return (
    <table styleName="root">
      <thead>
        <tr>
          <th>User</th>
          <th>Step</th>
          <th>Status</th>
          <th>Administrative Actions</th>
          <th>&nbsp;</th>
          <th>Log</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <OnboardingAdminListUser user={user} key={user.username} />
        ))}
      </tbody>
    </table>
  );
};

OnboardingAdminList.propTypes = {
  users: PropTypes.arrayOf(onboardingUserPropType).isRequired
};

const OnboardingAdmin = () => {
  const dispatch = useDispatch();

  const { users, offset, limit, loading, error } = useSelector(
    state => state.onboarding.admin
  );

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: { offset, limit }
    });
  }, [dispatch, offset, limit]);

  return (
    <div styleName="container">
      <div styleName="container-header">
        <h5>Administrator Controls</h5>
      </div>
      {loading && (
        <div>
          <LoadingSpinner />
        </div>
      )}
      {error && (
        <div>
          <Message type="warn">
            Unable to access Onboarding administration
          </Message>
        </div>
      )}
      {!loading && !error && <OnboardingAdminList users={users} />}
    </div>
  );
};

export default OnboardingAdmin;
