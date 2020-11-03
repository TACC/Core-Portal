import React from 'react';
import renderHtml from 'utils/renderHtml';
import { stepPropType } from './OnboardingPropTypes';
import OnboardingStatus from './OnboardingStatus';
import OnboardingActions from './OnboardingActions';
import './OnboardingStep.module.scss';

const OnboardingStep = ({ step }) => {
  const styleName = `root ${step.state === 'pending' ? 'disabled' : ''}`;
  return (
    <div styleName={styleName}>
      <div styleName="name">{step.displayName}</div>
      <div styleName="description">{renderHtml(step.description)}</div>
      <div styleName="status">
        <OnboardingStatus step={step} />
        <OnboardingActions step={step} />
      </div>
    </div>
  );
};

OnboardingStep.propTypes = {
  step: stepPropType.isRequired
};

OnboardingStep.defaultProps = {};

export default OnboardingStep;
