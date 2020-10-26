import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { LoadingSpinner } from '_common';
import { Button } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';

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

function OnboardingStep({ step }) {
  return (
    <div>
      <h4>{` ${step.displayName} (${step.state}) `}</h4>
      {step.events.map(event => (
        <OnboardingEvent event={event} key={uuidv4()} />
      ))}
    </div>
  );
}

OnboardingStep.propTypes = {
  step: PropTypes.shape({
    state: PropTypes.string,
    displayName: PropTypes.string,
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
  const loading = useSelector(state => state.onboarding.user.loading);
  const error = useSelector(state => state.onboarding.user.error);

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER',
      payload: {
        user: params.username || ''
      }
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
      <h2>{`${user.username} - ${user.lastName}, ${user.firstName}`}</h2>
      <div>
        {user.setupComplete ? (
          <Button href="/workbench/">Continue to Dashboard</Button>
        ) : (
          <h4>Setting up your account</h4>
        )}
      </div>
      {user.steps.map(step => (
        <OnboardingStep step={step} key={uuidv4()} />
      ))}
    </div>
  );
}

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
