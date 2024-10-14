import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import OnboardingUser from './OnboardingUser';
import { onboardingUserFixture } from '../../redux/sagas/fixtures/onboarding.fixture';
import { initialState as initialMockState } from '../../redux/reducers/onboarding.reducers';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';

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
    authenticatedUser: {},
    ticketCreate,
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
      workbench: {
        config: { onboardingCompleteRedirect: '/custom_route/' },
      },
    };
    const store = mockStore(state);

    const { getByText } = renderOnboardingUserComponent(store);
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
      authenticatedUser: {
        user: {
          isStaff: true,
        },
      },
    };
    const store = mockStore(state);
    const { getByText } = renderOnboardingUserComponent(store);
    expect(getByText(/Last, First/)).toBeDefined();
    expect(getByText(/Approve/)).toBeDefined();
    expect(getByText(/Deny/)).toBeDefined();
  });
});
