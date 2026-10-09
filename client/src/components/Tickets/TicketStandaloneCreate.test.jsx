import React from 'react';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import TicketStandaloneCreate from './TicketStandaloneCreate';
import initialIntroMessageComponents from '../../redux/reducers/portalMessages.reducers';

const mockStore = configureStore();

describe('TicketStandaloneCreate', () => {
  it('renders ticket creation and shows intro message', () => {
    const store = mockStore({
      introMessageComponents: {
        ...initialIntroMessageComponents,
        TICKETS: true,
      },
    });

    const { getByRole } = renderComponent(<TicketStandaloneCreate />, store);
    expect(
      getByRole('alert', { class: /introMessageGeneral/i })
    ).toBeInTheDocument();
  });

  it('renders ticket creation and hides intro message if already dismissed', () => {
    const store = mockStore({
      introMessageComponents: {
        ...initialIntroMessageComponents,
        TICKETS: false,
      },
    });

    const { queryByRole } = renderComponent(<TicketStandaloneCreate />, store);

    expect(queryByRole('alert')).toBeNull();
  });
});
