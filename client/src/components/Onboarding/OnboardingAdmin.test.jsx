import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import OnboardingAdmin from './OnboardingAdmin';
import { onboardingAdminState } from '../../redux/sagas/fixtures/onboarding.fixture';

const mockStore = configureStore();

function renderOnboardingAdminComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <OnboardingAdmin />
      </BrowserRouter>
    </Provider>
  );
}

// Onboarding Admin component rendering
describe('Onboarding Admin View', () => {
  it('renders onboarding steps', () => {
    const store = mockStore({
      onboarding: {
        ...onboardingAdminState,
      },
    });

    const { getByText } = renderOnboardingAdminComponent(store);
    expect(getByText(/First Last/)).toBeDefined();
    expect(getByText(/username/)).toBeDefined();
  });
});

// Onboarding Admin component rendering
describe('Onboarding Admin View', () => {
  it('renders onboarding steps', () => {
    const store = mockStore({
      onboarding: {
        ...onboardingAdminState,
        admin: {
          // Data based off users payload output, 3 generated users that have more than 2 steps
          users: [
            {
              email: 'User1@example.com',
              firstName: 'First1',
              isStaff: false,
              lastName: 'Last1',
              setupComplete: false,
              steps: [
                {
                  step: 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
                  displayName: 'Allocations',
                  description: 'Checking if allocations have been completed',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'completed',
                },
                {
                  step: 'portal.apps.onboarding.steps.test_steps.MockStep',
                  displayName: 'Checking Project Membership',
                  description:
                    'Checking project membership to specific project',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'staffwait',
                },
                {
                  step: 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
                  displayName: 'System Access',
                  description:
                    'Setting up access to TACC storage and execution systems. No action required.',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'pending',
                },
              ],
              username: 'User1',
            },
            {
              email: 'User2@example.com',
              firstName: 'First2',
              isStaff: false,
              lastName: 'Last2',
              setupComplete: false,
              steps: [
                {
                  step: 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
                  displayName: 'Allocations',
                  description: 'Checking if allocations have been completed',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'completed',
                },
                {
                  step: 'portal.apps.onboarding.steps.test_steps.MockStep',
                  displayName: 'Checking Project Membership',
                  description:
                    'Checking project membership to specific project',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'staffwait',
                },
                {
                  step: 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
                  displayName: 'System Access',
                  description:
                    'Setting up access to TACC storage and execution systems. No action required.',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'pending',
                },
              ],
              username: 'User2',
            },
            {
              email: 'User3@example.com',
              firstName: 'First3',
              isStaff: false,
              lastName: 'Last3',
              setupComplete: false,
              steps: [
                {
                  step: 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
                  displayName: 'Allocations',
                  description: 'Checking if allocations have been completed',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'completed',
                },
                {
                  step: 'portal.apps.onboarding.steps.test_steps.MockStep',
                  displayName: 'Checking Project Membership',
                  description:
                    'Checking project membership to specific project',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'staffwait',
                },
                {
                  step: 'portal.apps.onboarding.steps.system_access_v3.SystemAccessStepV3',
                  displayName: 'System Access',
                  description:
                    'Setting up access to TACC storage and execution systems. No action required.',
                  userConfirm: 'Confirm',
                  staffApprove: 'Approve',
                  state: 'pending',
                },
              ],
              username: 'User3',
            },
          ],
          offset: 0,
          limit: 25,
          total: 3,
          query: '',
          loading: false,
          error: null,
        },
      },
    });

    const { getByText, container } = renderOnboardingAdminComponent(store);
    const userElements = container.querySelectorAll('.user-row');
    // Check style for user elements
    userElements.forEach((element, index) => {
      if (index % 2 === 0) {
        expect(element).toHaveClass('even-row');
      } else {
        expect(element).toHaveClass('odd-row');
      }
    });
    // Check if users last and first names have been defined
    expect(getByText(/First1 Last1/)).toBeDefined();
    expect(getByText(/First2 Last2/)).toBeDefined();
    expect(getByText(/First3 Last3/)).toBeDefined();
  });
});
