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

describe('Onboarding Admin View', () => {
  it('renders onboarding steps', () => {
    const store = mockStore({
      onboarding: {
        ...onboardingAdminState,
      },
    });

    const { getByText } = renderOnboardingAdminComponent(store);
    expect(getByText(/First Last/)).toBeDefined();
  });
});
