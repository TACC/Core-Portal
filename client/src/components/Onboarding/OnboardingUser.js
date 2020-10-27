import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { LoadingSpinner } from '_common';
import { Button } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import './OnboardingUser.scss';

function OnboardingEvent({ event }) {
  return <div>{`${event.time} - ${event.message}`}</div>;
}

OnboardingEvent.propTypes = {
  event: PropTypes.shape({
    time: PropTypes.string,
    message: PropTypes.string
  }).isRequired
};

OnboardingEvent.defaultProps = {};

function OnboardingStatus({ step }) {
  const className = 'onboarding-status ' + step.state;
  if ('customStatus' in step) {
    return <span className={className}>{step.customStatus}</span>;
  }
  switch (step.state) {
    case 'pending':
      return <span className={className}>Preparing</span>;
    case 'staffwait':
      return (
        <span>
          <a>{step.staffApprove}</a>
          <a>{step.staffDeny}</a>
        </span>
      );
    case 'userwait':
      return <a>{step.clientAction}</a>;
    case 'failed':
      return <span className={className}>Unsuccessful</span>;
    case 'completed':
      return <span className={className}>Completed</span>;
    case 'processing':
      return (
        <span className={className}>
          Processing <LoadingSpinner />
        </span>
      );
    default:
      return <span>{step.state}</span>
  }
}

OnboardingStatus.propTypes = {
  step: PropTypes.shape({
    state: PropTypes.string,
    customStatus: PropTypes.string
  }).isRequired
};

OnboardingStatus.defaultProps = {};

function OnboardingStep({ step }) {
  return (
    <div>
      <div>{step.displayName}</div>
      <div>{step.description}</div>
      <div>
        <OnboardingStatus step={step} />
      </div>
      <hr />
    </div>
  );
}

OnboardingStep.propTypes = {
  step: PropTypes.shape({
    state: PropTypes.string,
    displayName: PropTypes.string,
    description: PropTypes.string,
    userConfirm: PropTypes.string,
    staffApprove: PropTypes.string,
    staffDeny: PropTypes.string,
    customStatus: PropTypes.string,
    events: PropTypes.arrayOf(
      PropTypes.shape({
        time: PropTypes.string,
        message: PropTypes.string
      })
    )
  }).isRequired
};

OnboardingStep.defaultProps = {};

function OnboardingUser() {
  const { params } = useRouteMatch();
  const dispatch = useDispatch();
  const user = useSelector(state => state.onboarding.user);
  const isStaff = useSelector(state => state.authenticatedUser.isUser);
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
    <div>
      {isStaff ? (
        <div>
          Onboarding Administration for {user.username} - {user.lastName},{' '}
          {user.firstName}
        </div>
      ) : (
        <div>
          The following steps must be completed before accessing the portal
        </div>
      )}
      {user.steps.map(step => (
        <OnboardingStep step={step} key={uuidv4()} />
      ))}
      <div>
        {user.setupComplete ? (
          <Button href="/workbench/">Access Dashboard</Button>
        ) : null}
      </div>
    </div>
  );
}

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
