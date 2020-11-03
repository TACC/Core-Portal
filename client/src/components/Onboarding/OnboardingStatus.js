import React from 'react';
import { Pill, LoadingSpinner } from '_common';
import { stepPropType } from './OnboardingPropTypes';
import './OnboardingStatus.module.scss';

const OnboardingStatus = ({ step }) => {
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
};

OnboardingStatus.propTypes = {
  step: stepPropType.isRequired
};

OnboardingStatus.defaultProps = {};

export default OnboardingStatus;
