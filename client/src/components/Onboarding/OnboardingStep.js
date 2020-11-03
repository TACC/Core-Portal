import React from 'react';
import { stepPropType } from './OnboardingPropTypes';
import OnboardingStatus from './OnboardingStatus';
import OnboardingActions from './OnboardingActions';
import './OnboardingStep.module.scss';

const OnboardingStep = ({ step }) => {
  return (
    <div styleName="root">
      <div styleName="name">{step.displayName}</div>
      <div
        /* eslint-disable react/no-danger */
        styleName="description"
        dangerouslySetInnerHTML={{ __html: step.description }}
      />
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
