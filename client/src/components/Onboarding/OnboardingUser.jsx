import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, LoadingSpinner, Section } from '_common';
import { Button as ReactstrapButton } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import OnboardingStep from './OnboardingStep';

import styles from './OnboardingUser.module.scss';

const OnboardingUser = () => {
  const { params } = useRouteMatch();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.onboarding.user);
  const isStaff = useSelector((state) =>
    state.authenticatedUser.user ? state.authenticatedUser.user.isStaff : false
  );
  const loading = useSelector((state) => state.onboarding.user.loading);
  const error = useSelector((state) => state.onboarding.user.error);
  const onboardingCompleteRedirect = useSelector(
    (state) => state.workbench.config.onboardingCompleteRedirect
  );
  const continueLink = onboardingCompleteRedirect || '/workbench/';

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER',
      payload: {
        user: params.username || '',
      },
    });
  }, [params]);

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
    <Section
      messageComponentName="ONBOARDING"
      header={
        isStaff
          ? `Onboarding Administration for ${user.username} - ${user.lastName}, ${user.firstName}`
          : 'The following steps must be completed before accessing the portal'
      }
      contentClassName={styles.content}
      contentLayoutName="oneColumn"
      contentShouldScroll
      content={
        <>
          {user.steps.map((step) => (
            <OnboardingStep step={step} key={uuidv4()} />
          ))}
          <div className={styles.access}>
            <Button
              type="link"
              onClick={() =>
                dispatch({
                  type: 'TICKET_CREATE_OPEN_MODAL',
                  payload: {
                    provideDashBoardLinkOnSuccess: false,
                    showAsModalOnDashboard: false,
                    subject: `Onboarding`,
                  },
                })
              }
            >
              <h6>Get Help</h6>
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <ReactstrapButton
              color="primary"
              href={continueLink}
              disabled={!user.setupComplete}
            >
              Continue
            </ReactstrapButton>
          </div>
        </>
      }
    />
  );
};

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
