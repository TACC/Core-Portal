import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import FeedbackForm from './FeedbackForm';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

const exampleAuthenticatedUser = {
  first_name: 'Max',
  username: 'mmunstermann',
  last_name: 'Munstermann',
  email: 'max@munster.mann',
  oauth: {
    expires_in: 14400,
    scope: 'default'
  },
  isStaff: false
};

describe('FeedbackModal', () => {
  it('renders modal with authenticated user information', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate
      }
    });

    const { getAllByText, getByDisplayValue } = renderComponent(
      <FeedbackForm authenticatedUser={exampleAuthenticatedUser} />,
      store
    );
    expect(getByDisplayValue(/Max/)).toBeInTheDocument();
    expect(getByDisplayValue(/Munstermann/)).toBeInTheDocument();
    expect(getByDisplayValue(/max@munster.mann/)).toBeInTheDocument();
  });

  it('renders spinner when creating a feedback', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creating: true
      }
    });

    const { getByTestId } = renderComponent(
      <FeedbackForm authenticatedUser={exampleAuthenticatedUser} />,
      store
    );
    expect(getByTestId('creating-spinner'));
  });

  it('renders a feedback creation error', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creatingError: true,
        creatingErrorMessage: 'Mock error'
      }
    });

    const { getByText } = renderComponent(
      <FeedbackForm authenticatedUser={exampleAuthenticatedUser} />,
      store
    );
    expect(getByText(/Mock error/)).toBeDefined();
  });
});
