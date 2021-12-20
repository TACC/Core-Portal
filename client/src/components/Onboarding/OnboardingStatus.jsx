import React from 'react';
import { Pill, LoadingSpinner } from '_common';
import { stepPropType } from './OnboardingPropTypes';
import styles from './OnboardingStatus.module.scss';
import './OnboardingStatus.scss';

const getContents = (step) => {
  let type = '';
  switch (step.state) {
    case 'processing':
    case 'pending':
      type = 'normal';
      break;
    case 'failed':
    case 'error':
      type = 'danger';
      break;
    case 'staffwait':
    case 'userwait':
      type = 'warning';
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
      return <Pill type={type}>Waiting for User</Pill>;
    case 'failed':
    case 'error':
      return <Pill type={type}>Unsuccessful</Pill>;
    case 'completed':
      return <Pill type={type}>Completed</Pill>;
    case 'processing':
      return (
        <span className={styles.processing}>
          <Pill type={type}>Processing</Pill>
          <LoadingSpinner
            placement="inline"
            className="onboarding-status__loading"
          />
        </span>
      );
    default:
      if (step.state) {
        return <Pill type="normal">{step.state}</Pill>;
      }
      return null;
  }
};

const OnboardingStatus = ({ step }) => {
  const contents = getContents(step);
  if (!contents) {
    return null;
  }
  return <span className={styles.root}>{getContents(step)}</span>;
};

OnboardingStatus.propTypes = {
  step: stepPropType.isRequired,
};

OnboardingStatus.defaultProps = {};

export default OnboardingStatus;
