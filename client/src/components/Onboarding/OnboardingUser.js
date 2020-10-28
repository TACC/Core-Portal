import React, { useEffect, useCallback } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { LoadingSpinner, Message, Pill } from '_common';
import { Button } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';

import './OnboardingUser.scss';

const eventPropType = PropTypes.shape({
  time: PropTypes.string,
  message: PropTypes.string
});

const stepPropType = PropTypes.shape({
  step: PropTypes.string,
  state: PropTypes.string,
  displayName: PropTypes.string,
  description: PropTypes.string,
  userConfirm: PropTypes.string,
  staffApprove: PropTypes.string,
  staffDeny: PropTypes.string,
  customStatus: PropTypes.string,
  events: PropTypes.arrayOf(eventPropType)
});

function OnboardingEvent({ event }) {
  return <div>{`${event.time} - ${event.message}`}</div>;
}

OnboardingEvent.propTypes = {
  event: eventPropType.isRequired
};

OnboardingEvent.defaultProps = {};

function OnboardingActions({ step }) {
  const dispatch = useDispatch();
  const actionCallback = useCallback((action, username) => {
    dispatch({
      type: 'POST_ONBOARDING_ACTION',
      payload: {
        step: step.step,
        action,
        username
      }
    });
  });
  const isStaff = useSelector(state =>
    state.authenticatedUser.user ? state.authenticatedUser.user.isStaff : false
  );
  const isSending = useSelector(
    state =>
      state.onboarding.action.loading &&
      state.onboarding.action.step === step.step
  );
  const error = useSelector(state => state.onboarding.action.error);
  const actionStep = useSelector(state => state.onboarding.action.step);
  const { params } = useRouteMatch();
  const authUsername = useSelector(state =>
    state.authenticatedUser.user ? state.authenticatedUser.user.username : ''
  );

  const hasSendingError = actionStep === step.step && error;

  // If the route loaded shows we are viewing a different user
  // (such as an admin viewing a user) then pull the username for
  // actions from the route. Ohterwise, use the username of whomever is logged in
  const username = params.username || authUsername;

  if (hasSendingError) {
    return (
      <Message type="warn" className="appDetail-error">
        We were unable to perform this action.
      </Message>
    );
  }

  return (
    <span className="onboarding-actions">
      {isStaff && step.state === 'staffwait' ? (
        <span>
          <Button
            color="link"
            disabled={isSending}
            onClick={() => actionCallback('staff_approve', username)}
          >
            <h6>{step.staffApprove}</h6>
          </Button>
          <Button
            color="link"
            disabled={isSending}
            onClick={() => actionCallback('staff_deny', username)}
          >
            <h6>{step.staffDeny}</h6>
          </Button>
        </span>
      ) : null}
      {step.state === 'userwait' ? (
        <Button
          color="link"
          disabled={isSending}
          onClick={() => actionCallback('user_confirm', username)}
        >
          <h6>{step.userConfirm}</h6>
        </Button>
      ) : null}
      {isSending ? <LoadingSpinner placement="inline" /> : null}
    </span>
  );
}

OnboardingActions.propTypes = {
  step: stepPropType.isRequired
};

OnboardingActions.defaultProps = {};

function OnboardingStatus({ step }) {
  let type = '';
  switch (step.state) {
    case 'processing':
    case 'pending':
      type = 'normal';
      break;
    case 'failed':
      type = 'danger';
      break;
    case 'staffwait':
    case 'userwait':
      type = 'alert';
      break;
    case 'completed':
      type = 'success';
      break;
    default:
      type = 'normal';
  }
  if ('customStatus' in step) {
    return <Pill type={type}>{step.customStatus}</Pill>;
  }
  switch (step.state) {
    case 'pending':
      return <Pill type={type}>Preparing</Pill>;
    case 'staffwait':
      return <Pill type="normal">Waiting for Staff Approval</Pill>;
    case 'userwait':
      return null;
    case 'failed':
      return <Pill type={type}>Unsuccessful</Pill>;
    case 'completed':
      return <Pill type={type}>Completed</Pill>;
    case 'processing':
      return (
        <span className="onboarding-processing">
          <Pill type={type}>Processing</Pill>
          <LoadingSpinner placement="inline" />
        </span>
      );
    default:
      return <span>{step.state}</span>;
  }
}

OnboardingStatus.propTypes = {
  step: stepPropType.isRequired
};

OnboardingStatus.defaultProps = {};

function OnboardingStep({ step }) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-step__name">{step.displayName}</div>
      <div
        className="onboarding-step__description"
        dangerouslySetInnerHTML={{ __html: step.description }}
      />
      <div>
        <OnboardingStatus step={step} />
        <OnboardingActions step={step} />
      </div>
    </div>
  );
}

OnboardingStep.propTypes = {
  step: stepPropType.isRequired
};

OnboardingStep.defaultProps = {};

function OnboardingUser() {
  const { params } = useRouteMatch();
  const dispatch = useDispatch();
  const user = useSelector(state => state.onboarding.user);
  const isStaff = useSelector(state =>
    state.authenticatedUser.user ? state.authenticatedUser.user.isStaff : false
  );
  const loading = useSelector(state => state.onboarding.user.loading);
  const error = useSelector(state => state.onboarding.user.error);

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER',
      payload: {
        user: params.username || ''
      }
    });
    dispatch({
      type: 'FETCH_AUTHENTICATED_USER'
    });
  }, [dispatch, params]);

  if (loading) {
    return (
      <div data-testid="loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div>Unable to retrieve your onboarding steps</div>;
  }

  return (
    <div className="onboarding">
      {isStaff ? (
        <div className="onboarding__title">
          Onboarding Administration for {user.username} - {user.lastName},{' '}
          {user.firstName}
        </div>
      ) : (
        <div className="onboarding__title">
          The following steps must be completed before accessing the portal
        </div>
      )}
      <div className="onboarding__container">
        {user.steps.map(step => (
          <OnboardingStep step={step} key={uuidv4()} />
        ))}
        <div className="onboarding__access">
          {user.setupComplete ? (
            <Button href="/workbench/">Access Dashboard</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
