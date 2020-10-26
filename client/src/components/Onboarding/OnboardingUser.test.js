import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import OnboardingUser from './OnboardingUser';
import { onboardingUserFixture } from '../../redux/sagas/fixtures/onboarding.fixture';
import { initialState } from '../../redux/reducers/onboarding.reducers';

const mockStore = configureStore();
const initialMockState = {
  ...initialState
};

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
      }
    });

    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/username/)).toBeDefined();
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
      }
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
      }
    });

    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/Unable to retrieve your onboarding steps/)).toBeDefined();
  });
});
