import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon, LoadingSpinner, Message, Paginator } from '_common';
import { Button } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import { onboardingUserPropType } from './OnboardingPropTypes';
import OnboardingEventLogModal from './OnboardingEventLogModal';
import OnboardingStatus from './OnboardingStatus';
import OnboardingAdminSearchbar from './OnboardingAdminSearchbar';
import './OnboardingAdmin.module.scss';
import './OnboardingAdmin.scss';

const OnboardingApproveActions = ({ callback, disabled, action }) => {
  return (
    <div styleName="approve-container">
      <Button
        className="c-button--secondary"
        styleName="approve"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('staff_approve')}
        disabled={disabled}
      >
        {action === 'staff_approve' ? (
          <LoadingSpinner
            placement="inline"
            className="onboarding-admin__action-spinner"
          />
        ) : (
          <Icon name="approved-reverse" />
        )}
        <>Approve</>
      </Button>
      <Button
        className="c-button--secondary"
        styleName="approve"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('staff_deny')}
        disabled={disabled}
      >
        {action === 'staff_approve' ? (
          <LoadingSpinner
            placement="inline"
            className="onboarding-admin__action-spinner"
          />
        ) : (
          <Icon name="approved-reverse" />
        )}
        <>Deny</>
      </Button>
    </div>
  );
};

OnboardingApproveActions.propTypes = {
  callback: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  action: PropTypes.string
};

OnboardingApproveActions.defaultProps = {
  disabled: false,
  action: null
};

const OnboardingResetLinks = ({ callback, disabled, disableSkip, action }) => {
  return (
    <div styleName="reset">
      <Button
        color="link"
        styleName="action-link"
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('reset')}
        disabled={disabled}
      >
        {action === 'reset' && (
          <LoadingSpinner
            placement="inline"
            className="onboarding-admin__action-spinner"
          />
        )}
        Reset
      </Button>
      <>|</>
      <Button
        color="link"
        styleName="action-link"
        disabled={disabled || disableSkip}
        // eslint-disable-next-line standard/no-callback-literal
        onClick={() => callback('complete')}
      >
        {action === 'complete' && (
          <LoadingSpinner
            placement="inline"
            className="onboarding-admin__action-spinner"
          />
        )}
        Skip
      </Button>
    </div>
  );
};

OnboardingResetLinks.propTypes = {
  callback: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  disableSkip: PropTypes.bool,
  action: PropTypes.string
};

OnboardingResetLinks.defaultProps = {
  disabled: false,
  disableSkip: false,
  action: null
};

const OnboardingAdminListUser = ({ user, viewLogCallback }) => {
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
  const adminAction = useSelector(state => state.onboarding.action);

  return (
    <tr styleName="user">
      <td styleName="name">
        <div>{`${user.firstName} ${user.lastName}`}</div>
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
                disabled={
                  // Disable all admin actions while any action is being performed
                  adminAction.loading
                }
                action={
                  // If this user and step currently is running an admin action, pass down the action
                  adminAction.username === user.username &&
                  adminAction.step === step.step
                    ? adminAction.action
                    : null
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
              disabled={adminAction.loading}
              disableSkip={step.state === 'completed'}
              sentAction={
                adminAction.username === user.username &&
                adminAction.step === step.step
                  ? adminAction.action
                  : null
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
            <Button
              color="link"
              styleName="action-link"
              onClick={() => viewLogCallback(user, step)}
            >
              View Log
            </Button>
          </div>
        ))}
      </td>
    </tr>
  );
};

OnboardingAdminListUser.propTypes = {
  user: onboardingUserPropType.isRequired,
  viewLogCallback: PropTypes.func.isRequired
};

const OnboardingAdminList = ({ users, viewLogCallback }) => {
  return (
    <table styleName="users">
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
          <OnboardingAdminListUser
            user={user}
            key={user.username}
            viewLogCallback={viewLogCallback}
          />
        ))}
      </tbody>
    </table>
  );
};

OnboardingAdminList.propTypes = {
  users: PropTypes.arrayOf(onboardingUserPropType).isRequired,
  viewLogCallback: PropTypes.func.isRequired
};

const OnboardingAdmin = () => {
  const dispatch = useDispatch();
  const [eventLogModalParams, setEventLogModalParams] = useState(null);

  const { users, offset, limit, total, query, loading, error } = useSelector(
    state => state.onboarding.admin
  );

  const paginationCallback = useCallback(
    page => {
      dispatch({
        type: 'FETCH_ONBOARDING_ADMIN_LIST',
        payload: {
          offset: (page - 1) * limit,
          limit,
          query
        }
      });
    },
    [offset, limit, query]
  );

  const viewLogCallback = useCallback(
    (user, step) => {
      setEventLogModalParams({ user, step });
    },
    [setEventLogModalParams]
  );

  const toggleViewLogModal = useCallback(() => {
    setEventLogModalParams();
  }, [setEventLogModalParams]);

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: { offset, limit, query: null }
    });
  }, [dispatch]);

  const current = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  if (loading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return (
      <Message type="warn">Unable to access Onboarding administration</Message>
    );
  }
  return (
    <div styleName="root">
      <div styleName="container">
        <div styleName="container-header">
          <h5>Administrator Controls</h5>
          <OnboardingAdminSearchbar />
        </div>
        {users.length === 0 && (
          <div styleName="no-users-placeholder">
            <Message type="warn">No users to show.</Message>
          </div>
        )}
        <div styleName="user-container">
          {users.length > 0 && (
            <OnboardingAdminList
              users={users}
              viewLogCallback={viewLogCallback}
            />
          )}
        </div>
        {users.length > 0 && (
          <div styleName="paginator-container">
            <Paginator
              current={current}
              pages={pages}
              callback={paginationCallback}
              spread={5}
            />
          </div>
        )}
        {eventLogModalParams && (
          <OnboardingEventLogModal
            params={eventLogModalParams}
            toggle={toggleViewLogModal}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingAdmin;
