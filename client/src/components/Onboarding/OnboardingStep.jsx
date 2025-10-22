import React from 'react';
import renderHtml from 'utils/renderHtml';
import { stepPropType } from './OnboardingPropTypes';
import OnboardingStatus from './OnboardingStatus';
import OnboardingActions from './OnboardingActions';
import styles from './OnboardingStep.module.css';

const OnboardingStep = ({ step }) => {
  const styleName = `${styles.root} ${
    step.state === styles.pending ? 'disabled' : ''
  }`;
  return (
    <div className={styleName}>
      <div className={styles.name}>{step.displayName}</div>
      <div className={styles.description}>{renderHtml(step.description)}</div>
      <div className={styles.status}>
        <OnboardingStatus step={step} />
        <OnboardingActions step={step} />
      </div>
    </div>
  );
};

OnboardingStep.propTypes = {
  step: stepPropType.isRequired,
};

OnboardingStep.defaultProps = {};

export default OnboardingStep;
