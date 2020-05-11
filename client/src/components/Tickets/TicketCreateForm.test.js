import React from 'react';
import { render } from '@testing-library/react';
import TicketCreateForm from './TicketCreateForm';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';

const mockStore = configureStore();
const initialMockState = {
  creating: false,
  creatingSuccess: false,
  createdTicketId: null,
  creatingError: false,
  creatingErrorMessage: null
};

const exampleAuthenticatedUser = {
  first_name: "Max",
  username: "mmunstermann",
  last_name: "Munstermann",
  email: "max@munster.mann",
  oauth: {
    expires_in: 14400,
    scope: "default"
  },
  isStaff: false
}

function renderTicketsCreateForm(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <TicketCreateForm />
      </BrowserRouter>
    </Provider>
  );
}

describe('TicketCreateForm', () => {
  it('renders form with authenticated user information', () => {
    const store = mockStore({
      ticketCreate: {
        ...initialMockState
      }
    });

    const { getByText, getAllByText } = renderTicketsCreateForm(store);
    expect(getByText(/Max/)).toBeInTheDocument();
    expect(getAllByText(/Explain your steps/)).toBeDefined();
  });

  it('renders spinner when creating a ticket', () => {
    const store = mockStore({
      ticketCreate: {
        ...initialMockState,
        creating: true
      }
    });

    const { getByText, getByTestId } = renderTicketsCreateForm(store);
    expect(getByTestId('creating-spinner'));
  });
});
