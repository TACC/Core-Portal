import React from 'react';
import configureStore from 'redux-mock-store';
import OnboardingUser from './OnboardingUser';
import { onboardingUserFixture } from '../../redux/sagas/fixtures/onboarding.fixture';
import { initialState as initialMockState } from '../../redux/reducers/onboarding.reducers';
import renderComponent from 'utils/testing';

const mockStore = configureStore();

function renderOnboardingUserComponent(store, config, user) {
  return renderComponent(<OnboardingUser />, store, undefined, config, user);
}

const genericState = (error, loading) => {
  return {
    onboarding: {
      ...initialMockState,
      user: {
        ...onboardingUserFixture,
        error,
        loading,
      },
    },
    workbench: {
      config: {},
    },
  };
};

describe('Onboarding User View', () => {
  it('renders onboarding steps', () => {
    const store = mockStore(genericState(null, false));

    const { getByText } = renderOnboardingUserComponent(store);
    expect(
      getByText(/must be completed before accessing the portal/)
    ).toBeDefined();
    expect(
      getByText(/Continue/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/workbench/');
  });

  it('renders a loading screen', () => {
    const store = mockStore(genericState(null, true));
    const { getByTestId } = renderOnboardingUserComponent(store);
    expect(getByTestId('loading')).toBeDefined();
  });

  it('supports customizable route for continue button', () => {
    const state = {
      ...genericState(null, false),
    };
    const store = mockStore(state);

    const { getByText } = renderOnboardingUserComponent(store, {
      config: { onboardingCompleteRedirect: '/custom_route/' },
    });
    expect(
      getByText(/Continue/)
        .closest('a')
        .getAttribute('href')
    ).toEqual('/custom_route/');
  });

  it('renders errors when onboarding for a user cannot be retrieved', () => {
    const store = mockStore(genericState(true, false));

    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/Unable to retrieve your onboarding steps/)).toBeDefined();
  });

  it('renders staff user interface', () => {
    const state = {
      ...genericState(null, false),
    };
    const store = mockStore(state);
    const { getByText } = renderOnboardingUserComponent(store, undefined, {
      isStaff: true,
    });
    expect(getByText(/Last, First/)).toBeDefined();
    expect(getByText(/Approve/)).toBeDefined();
    expect(getByText(/Deny/)).toBeDefined();
  });
});
