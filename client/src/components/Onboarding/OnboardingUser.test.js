import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import OnboardingUser from './OnboardingUser';
import { onboardingUserFixture } from '../../redux/sagas/fixtures/onboarding.fixture';
import { initialState as initialMockState } from '../../redux/reducers/onboarding.reducers';

const mockStore = configureStore();

function renderOnboardingUserComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <OnboardingUser />
      </BrowserRouter>
    </Provider>
  );
}

describe('Onboarding User View', () => {
  it('renders onboarding steps', () => {
    const store = mockStore({
      onboarding: {
        ...initialMockState,
        user: {
          ...onboardingUserFixture,
          error: null,
          loading: false
        }
      },
      authenticatedUser: {}
    });

    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/must be completed before accessing the portal/)).toBeDefined();
  });

  it('renders a loading screen', () => {
    const store = mockStore({
      onboarding: {
        ...initialMockState,
        user: {
          ...onboardingUserFixture,
          error: null,
          loading: true
        }
      },
      authenticatedUser: {}
    });
    const { getByTestId } = renderOnboardingUserComponent(store);
    expect(getByTestId('loading')).toBeDefined();
  });

  it('renders errors when onboarding for a user cannot be retrieved', () => {
    const store = mockStore({
      onboarding: {
        ...initialMockState,
        user: {
          ...onboardingUserFixture,
          error: 'error',
          loading: false
        }
      },
      authenticatedUser: {}
    });

    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/Unable to retrieve your onboarding steps/)).toBeDefined();
  });

  it('renders staff user interface', () => {
    const store = mockStore({
      onboarding: {
        ...initialMockState,
        user: {
          ...onboardingUserFixture,
          error: null,
          loading: false
        }
      },
      authenticatedUser: {
        user: {
          isStaff: true
        }
      }
    });
    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/Last, First/)).toBeDefined();
    expect(getByText(/Approve/)).toBeDefined();
    expect(getByText(/Deny/)).toBeDefined();
  });
});
