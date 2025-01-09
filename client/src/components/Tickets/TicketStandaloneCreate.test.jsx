import React from 'react';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import TicketStandaloneCreate from './TicketStandaloneCreate';
import { initialTicketCreateState as ticketCreate } from '../../redux/reducers/tickets.reducers';
import { initialState as workbench } from '../../redux/reducers/workbench.reducers';
import initialIntroMessageComponents from '../../redux/reducers/portalMessages.reducers';
import { initialState as user } from '../../redux/reducers/authenticated_user.reducer';

const mockStore = configureStore();

describe('TicketStandaloneCreate', () => {
  it('renders ticket creation and shows intro message', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: user,
      introMessageComponents: {
        ...initialIntroMessageComponents,
        TICKETS: true,
      },
      workbench,
    });

    const { getByRole } = renderComponent(<TicketStandaloneCreate />, store);
    expect(
      getByRole('alert', { class: /introMessageGeneral/i })
    ).toBeInTheDocument();
  });

  it('renders ticket creation and hides intro message if already dismissed', () => {
    const store = mockStore({
      ticketCreate,
      authenticatedUser: user,
      introMessageComponents: {
        ...initialIntroMessageComponents,
        TICKETS: false,
      },
      workbench,
    });

    const { queryByRole } = renderComponent(<TicketStandaloneCreate />, store);

    expect(queryByRole('alert')).toBeNull();
  });
});
