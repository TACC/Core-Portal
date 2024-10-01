import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import TicketCreateForm from './TicketCreateForm';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

const exampleAuthenticatedUser = {
  first_name: 'Max',
  username: 'mmunstermann',
  last_name: 'Munstermann',
  email: 'max@munster.mann',
  oauth: {
    expires_in: 14400,
  },
  isStaff: false,
};

describe('TicketCreateForm', () => {
  it('renders form for un-authenticated users', () => {
    const store = mockStore({
      ticketCreate,
      workbench,
    });

    const { getAllByText } = renderComponent(
      <TicketCreateForm provideDashBoardLinkOnSuccess={true} />,
      store
    );
    expect(getAllByText(/Explain your steps/)).toBeDefined();
  });

  it('renders form with authenticated user information', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
      },
      workbench,
    });

    const { getAllByText, getByDisplayValue } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    expect(getByDisplayValue(/Max/)).toBeInTheDocument();
    expect(getByDisplayValue(/Munstermann/)).toBeInTheDocument();
    expect(getByDisplayValue(/max@munster.mann/)).toBeInTheDocument();
    expect(getAllByText(/Explain your steps/)).toBeDefined();
  });

  it('renders spinner when creating a ticket', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creating: true,
      },
      workbench,
    });

    const { getByTestId } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    expect(getByTestId('loading-spinner'));
  });

  it('renders a ticket create ID upon success', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creatingSuccess: true,
        createdTicketId: 1234,
      },
      workbench,
    });

    const { getByText } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    expect(getByText(/1234/)).toBeDefined();
  });

  it('renders a ticket creation error', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creatingError: true,
        creatingErrorMessage: 'Mock error',
      },
      workbench,
    });

    const { getByText } = renderComponent(
      <TicketCreateForm
        authenticatedUser={exampleAuthenticatedUser}
        provideDashBoardLinkOnSuccess={true}
      />,
      store
    );
    expect(getByText(/Mock error/)).toBeDefined();
  });
});
