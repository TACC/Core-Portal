import React from 'react';
import { render } from '@testing-library/react';
import TicketsView, { getStatusText } from './TicketsLayout';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';

const mockStore = configureStore();
const initialMockState = {
  content: [],
  loading: false,
  loadingError: false,
  loadingErrorMessage: '',
};

const exampleTicketContent = [
  {
    id: '1',
    Subject: 'Some subject',
    Status: 'resolved',
    Created: 'Fri Mar 22 09:17:27 2019',
  },
  {
    id: '2',
    Subject: 'Another subject',
    Status: 'open',
    Created: 'Fri Mar 23 10:17:00 2019',
  },
];

function renderTicketsComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <TicketsView />
      </BrowserRouter>
    </Provider>
  );
}

describe('TicketLayout', () => {
  it('renders tickets', () => {
    const store = mockStore({
      ticketList: {
        ...initialMockState,
        content: exampleTicketContent,
      },
    });

    const { getAllByRole } = renderTicketsComponent(store);

    const columnHeaders = getAllByRole('columnheader');
    expect(columnHeaders[0]).toHaveTextContent(/Number/);
    expect(columnHeaders[1]).toHaveTextContent(/Subject/);
    expect(columnHeaders[2]).toHaveTextContent(/Date Added/);
    expect(columnHeaders[3]).toHaveTextContent(/Ticket Status/);
  });

  it('renders message when no tickets to show', () => {
    const store = mockStore({
      ticketList: {
        ...initialMockState,
      },
    });
    const { getByText } = renderTicketsComponent(store);
    expect(getByText(/No tickets. You can add a ticket/)).toBeDefined();
    expect(getByText(/here/).closest('a').getAttribute('href')).toEqual(
      '/workbench/dashboard/tickets/create/'
    );
  });

  it('renders when loading tickets', () => {
    const store = mockStore({
      ticketList: {
        ...initialMockState,
        loading: true,
      },
    });

    const { getByTestId } = renderTicketsComponent(store);

    expect(getByTestId('loading-spinner'));
  });

  it('converts supported ticket status to proper UI strings', () => {
    expect(getStatusText('new')).toEqual('New');
    expect(getStatusText('closed')).toEqual('Resolved');
    expect(getStatusText('resolved')).toEqual('Resolved');
    expect(getStatusText('open')).toEqual('In Progress');
    expect(getStatusText('user_wait')).toEqual('Reply Required');
    expect(getStatusText('internal_wait')).toEqual('Reply Sent');
    expect(() => {
      getStatusText('random_status');
    }).toThrow(RangeError);
  });

  it('renders an error message when unable to load tickets', () => {
    const store = mockStore({
      ticketList: {
        ...initialMockState,
        loadingError: true,
      },
    });
    const { getByText } = renderTicketsComponent(store);
    expect(getByText(/unable to retrieve/)).toBeDefined();
  });
});
