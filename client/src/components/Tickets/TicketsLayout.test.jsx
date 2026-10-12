import React from 'react';
import { findByText, screen } from '@testing-library/react';
import TicketsView, { getStatusText } from './TicketsLayout';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter } from 'react-router-dom';
import renderComponent from 'utils/testing';
import { server } from '@tacc/test-fixtures';
import { http, HttpResponse } from 'msw';

const mockStore = configureStore();

function renderTicketsComponent(store) {
  return renderComponent(<TicketsView />, store);
}

describe('TicketLayout', () => {
  it('renders tickets', () => {
    const store = mockStore({});

    const { getAllByRole } = renderTicketsComponent(store);

    const columnHeaders = getAllByRole('columnheader');
    expect(columnHeaders[0]).toHaveTextContent(/Number/);
    expect(columnHeaders[1]).toHaveTextContent(/Subject/);
    expect(columnHeaders[2]).toHaveTextContent(/Date Added/);
    expect(columnHeaders[3]).toHaveTextContent(/Ticket Status/);
  });

  it('renders message when no tickets to show', async () => {
    const store = mockStore({});

    server.use(
      http.get('/api/tickets', () => HttpResponse.json({ tickets: [] }))
    );

    renderTicketsComponent(store);
    expect(
      await screen.findByText(/No tickets. You can add a ticket/)
    ).toBeDefined();
    expect(screen.getByText(/here/).closest('a').getAttribute('href')).toEqual(
      '/workbench/dashboard/tickets/create/'
    );
  });

  it('renders when loading tickets', () => {
    const store = mockStore({});

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

  it('renders an error message when unable to load tickets', async () => {
    const store = mockStore({});

    server.use(
      http.get('/api/tickets', () => new HttpResponse(null, { status: 404 }))
    );
    renderTicketsComponent(store);
    expect(await screen.findByText(/unable to retrieve/)).toBeDefined();
  });
});
