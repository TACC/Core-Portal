import React from 'react';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import TicketStandaloneCreate from './TicketStandaloneCreate';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import initialWelcomeMessages from '../../redux/reducers/welcome.reducers';
import { initialState as user } from '../../redux/reducers/authenticated_user.reducer';

const mockStore = configureStore();

describe('TicketStandaloneCreate', () => {
  it('renders ticket creation and shows welcome message', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: user,
      welcomeMessages: initialWelcomeMessages
    });

    const { getByRole } = renderComponent(<TicketStandaloneCreate />, store);
    expect(getByRole('alert', {class: /welcomeMessageGeneral/i})).toBeInTheDocument();
  });

  it('renders ticket creation and hides welcome message if already dismissed', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: user,
      welcomeMessages: {...initialWelcomeMessages, TICKETS: false}
    });

    const { queryByRole } = renderComponent(<TicketStandaloneCreate />, store);

    expect(queryByRole('alert')).toBeNull();
  });
});
