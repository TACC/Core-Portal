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

function renderTicketsCreateForm(store, authenticatedUser) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <TicketCreateForm authenticatedUser={authenticatedUser}/>
      </BrowserRouter>
    </Provider>
  );
}

describe('TicketCreateForm', () => {
  it('renders form for un-authenticated users', () => {
    const store = mockStore({
      ticketCreate: {
        ...initialMockState
      }
    });

    const { getAllByText, getByDisplayValue } = renderTicketsCreateForm(store, null);
    expect(getAllByText(/Explain your steps/)).toBeDefined();
  });

  it('renders form with authenticated user information', () => {
    const store = mockStore({
      ticketCreate: {
        ...initialMockState
      }
    });

    const { getAllByText, getByDisplayValue } = renderTicketsCreateForm(store, exampleAuthenticatedUser);
    expect(getByDisplayValue(/Max/)).toBeInTheDocument();
    expect(getByDisplayValue(/Munstermann/)).toBeInTheDocument();
    expect(getByDisplayValue(/max@munster.mann/)).toBeInTheDocument();
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

  it('renders a ticket create ID upon success', () => {
    const store = mockStore({
      ticketCreate: {
        ...initialMockState,
        creatingSuccess: true,
        createdTicketId: 1234,
      }
    });

    const { getByText } = renderTicketsCreateForm(store);
    expect(getByText(/1234/)).toBeDefined();
  });

  it('renders a ticket creation error', () => {
    const store = mockStore({
      ticketCreate: {
        ...initialMockState,
        creatingError: true,
        creatingErrorMessage: "Mock error"
      }
    });

    const { getByText } = renderTicketsCreateForm(store);
    expect(getByText(/Mock error/)).toBeDefined();
  });
});
