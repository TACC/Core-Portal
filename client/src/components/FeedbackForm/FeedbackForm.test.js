import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import FeedbackForm from './FeedbackForm';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import { initialState as initialAuthenticatedUser } from '../../redux/reducers/authenticated_user.reducer';

import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

const exampleAuthenticatedUser = {
  user: {
    first_name: 'Max',
    username: 'mmunstermann',
    last_name: 'Munstermann',
    email: 'max@munster.mann',
    oauth: {
      expires_in: 14400,
      scope: 'default'
    },
    isStaff: false
  }
};

describe('FeedbackForm', () => {
  it('renders form', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: exampleAuthenticatedUser
    });

    const { getByText } = renderComponent(<FeedbackForm />, store);
    expect(getByText(/Feedback/)).toBeInTheDocument();
    expect(getByText(/Submit/)).toBeInTheDocument();
  });

  it('show spinner if waiting for authenticated user', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: { ...initialAuthenticatedUser }
    });

    const { getByTestId } = renderComponent(<FeedbackForm />, store);
    expect(getByTestId('loading-spinner'));
  });

  it('renders spinner when creating a feedback', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creating: true
      },
      authenticatedUser: exampleAuthenticatedUser
    });

    const { getByTestId } = renderComponent(<FeedbackForm />, store);
    expect(getByTestId('creating-spinner'));
  });
});
