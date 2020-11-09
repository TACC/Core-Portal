import React from 'react';
import renderComponent from 'utils/testing';
import configureStore from 'redux-mock-store';
import FeedbackButton from './FeedbackButton';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore();

describe('FeedbackButton', () => {
  it('renders correctly', () => {
    const store = mockStore({
      ticketCreate: {
        ...ticketCreate,
        creatingSuccess: true
      }
    });
    const { getByTestId } = renderComponent(<FeedbackButton />, store);
    expect(getByTestId('feedback-button'));
  });
});
