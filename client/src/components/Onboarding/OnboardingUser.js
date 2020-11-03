import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingSpinner } from '_common';
import { Button } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import OnboardingStep from './OnboardingStep';

import './OnboardingUser.module.scss';

const OnboardingUser = () => {
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
    <div styleName="root">
      <div styleName="title">
        {
          isStaff 
            ? `Onboarding Administration for ${user.username} - ${user.lastName}, ${user.firstName}`
            : 'The following steps must be completed before accessing the portal'
        }
      </div>
      <div styleName="container">
        {user.steps.map(step => (
          <OnboardingStep step={step} key={uuidv4()} />
        ))}
        <div styleName="access">
          {user.setupComplete ? (
            <Button href="/workbench/">Access Dashboard</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
