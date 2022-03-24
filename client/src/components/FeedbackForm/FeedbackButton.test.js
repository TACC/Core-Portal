import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import FeedbackButton from './FeedbackButton';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';

const mockStore = configureStore();

describe('FeedbackButton', () => {
  it('renders correctly', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creatingSuccess: true,
      },
    });
    const { getByRole } = renderComponent(<FeedbackButton />, store);
    expect(getByRole('button'));
  });
});
