import React from 'react';
import { render } from '@testing-library/react';
import OnboardingEventLogModal from './OnboardingEventLogModal';
import { onboardingUserFixture } from '../../redux/sagas/fixtures/onboarding.fixture';

describe('Onboarding Event Log Modal', () => {
  it('renders onboarding steps', () => {
    const params = {
      user: onboardingUserFixture,
      step: onboardingUserFixture.steps[0],
    };
    const { getByText } = render(
      <OnboardingEventLogModal toggle={() => {}} params={params} />
    );

    expect(getByText(/First Last/)).toBeDefined();
    expect(getByText(/Mock User Wait Step/)).toBeDefined();
    expect(getByText(/11:43/)).toBeDefined();
  });
});
