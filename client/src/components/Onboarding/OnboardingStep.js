import React from 'react';
import { stepPropType } from './OnboardingPropTypes';
import { OnboardingStatus }from './OnboardingStatus';
import { OnboardingActions } from './OnboardingActions';
import './OnboardingStep.module.scss';

function OnboardingStep({ step }) {
  return (
    <div className="onboarding-step">
      <div className="onboarding-step__name">{step.displayName}</div>
      <div
        /* eslint-disable react/no-danger */
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

export default OnboardingStep;