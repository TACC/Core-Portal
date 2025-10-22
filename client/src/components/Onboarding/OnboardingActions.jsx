import React, { useCallback } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, LoadingSpinner, Message } from '_common';
import { Button as ReactstrapButton } from 'reactstrap';
import { stepPropType } from './OnboardingPropTypes';
import styles from './OnboardingActions.module.scss';
import './OnboardingActions.css';

const OnboardingActions = ({ step }) => {
  const dispatch = useDispatch();
  const actionCallback = useCallback((action, username) => {
    dispatch({
      type: 'POST_ONBOARDING_ACTION',
      payload: {
        step: step.step,
        action,
        username,
      },
    });
  });
  const isStaff = useSelector((state) =>
    state.authenticatedUser.user ? state.authenticatedUser.user.isStaff : false
  );
  const isSending = useSelector(
    (state) =>
      state.onboarding.action.loading &&
      state.onboarding.action.step === step.step
  );
  const error = useSelector((state) => state.onboarding.action.error);
  const actionStep = useSelector((state) => state.onboarding.action.step);
  const { params } = useRouteMatch();
  const authUsername = useSelector((state) =>
    state.authenticatedUser.user ? state.authenticatedUser.user.username : ''
  );

  const hasSendingError = actionStep === step.step && error;

  // If the route loaded shows we are viewing a different user
  // (such as an admin viewing a user) then pull the username for
  // actions from the route. Otherwise, use the username of whomever is logged in
  const username = params.username || authUsername;

  if (hasSendingError) {
    return (
      <Message type="warn" className="appDetail-error">
        We were unable to perform this action.
      </Message>
    );
  }

  return (
    <span className={styles.root}>
      {isStaff && step.state === 'staffwait' ? (
        <>
          <Button
            type="link"
            className={styles.action}
            disabled={isSending}
            onClick={() => actionCallback('staff_approve', username)}
          >
            {step.staffApprove}
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            type="link"
            className={styles.action}
            disabled={isSending}
            onClick={() => actionCallback('staff_deny', username)}
          >
            {step.staffDeny}
          </Button>
        </>
      ) : null}
      {step.state === 'userwait' ? (
        step.data?.userlink ? (
          <ReactstrapButton
            color="link"
            className={styles.action}
            href={step.data?.userlink?.url}
          >
            {step.data?.userlink?.text}
          </ReactstrapButton>
        ) : (
          <Button
            type="link"
            className={styles.action}
            disabled={isSending}
            onClick={() => actionCallback('user_confirm', username)}
          >
            {step.userConfirm}
          </Button>
        )
      ) : null}
      {isStaff ? (
        <>
          <Button
            type="link"
            className={styles.action}
            disabled={isSending}
            onClick={() => actionCallback('reset', username)}
          >
            Admin Reset
          </Button>
          &nbsp;&nbsp;&nbsp;
          <Button
            type="link"
            className={styles.action}
            disabled={isSending}
            onClick={() => actionCallback('complete', username)}
          >
            Admin Skip
          </Button>
        </>
      ) : null}
      {isSending ? (
        <LoadingSpinner
          placement="inline"
          className="onboarding-action__loading"
        />
      ) : null}
    </span>
  );
};

OnboardingActions.propTypes = {
  step: stepPropType.isRequired,
};

OnboardingActions.defaultProps = {};

export default OnboardingActions;
