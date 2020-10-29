import React from 'react';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import TicketStandaloneCreate from './TicketStandaloneCreate';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import { initialState as user } from '../../redux/reducers/authenticated_user.reducer';

const mockStore = configureStore();

describe('TicketStandaloneCreate', () => {
  it('renders ticket creation and checks if user is authenticated', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: user
    });

    renderComponent(<TicketStandaloneCreate />, store);
    expect(store.getActions()).toEqual([{ type: 'FETCH_AUTHENTICATED_USER' }]);
  });
});
