import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingSpinner, Section } from '_common';
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
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <Section
      welcomeMessageName="ONBOARDING"
      header=
          {isStaff
            ? `Onboarding Administration for ${user.username} - ${user.lastName}, ${user.firstName}`
            : 'The following steps must be completed before accessing the portal'}
      contentStyleName="content"
      contentLayoutName="oneColumn"
      contentShouldScroll
      content={
        <>
        {user.steps.map(step => (
          <OnboardingStep step={step} key={uuidv4()} />
        ))}
        <div styleName="access">
          <Button
            color="link"
            styleName="button"
            onClick={() =>
              dispatch({
                type: 'TICKET_CREATE_OPEN_MODAL',
                payload: {
                  provideDashBoardLinkOnSuccess: false,
                  showAsModalOnDashboard: false,
                  subject: `Onboarding`
                }
              })
            }
          >
            Get Help
          </Button>
          <Button
            color="primary"
            styleName="button"
            href="/workbench/"
            disabled={!user.setupComplete}
          >
            Access Dashboard
          </Button>
        </div>
        </>
      }
    />
    /* eslint-enable prettier/prettier */
  );
};

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
