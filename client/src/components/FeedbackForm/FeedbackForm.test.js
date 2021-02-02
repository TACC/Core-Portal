import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import FeedbackForm from './FeedbackForm';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';

import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

describe('FeedbackForm', () => {
  it('renders form', () => {
    const store = mockStore({
      ticketCreate
    });

    const { getByText } = renderComponent(<FeedbackForm />, store);
    expect(getByText(/Feedback/)).toBeInTheDocument();
    expect(getByText(/Submit/)).toBeInTheDocument();
  });

  it('renders spinner when creating a feedback', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creating: true
      }
    });

    const { getByTestId } = renderComponent(<FeedbackForm />, store);
    expect(getByTestId('creating-spinner'));
  });
});
