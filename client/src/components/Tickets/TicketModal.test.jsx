import React from 'react';
import { vi } from 'vitest';
import { createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';
import { default as TicketModal, TicketHistory } from './TicketModal';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter, Route } from 'react-router-dom';
import renderComponent from 'utils/testing';
import { server } from '@tacc/test-fixtures';
import { http, HttpResponse } from 'msw';

const mockStore = configureStore();

const ticketAttachmentSettings = {
  workbench: {
    config: {
      ticketAttachmentMaxSizeMessage: 'Max File Size: 3MB',
      ticketAttachmentMaxSize: 3145728,
    },
  },
};

function renderTicketsModalComponent(store) {
  const modalHistory = createMemoryHistory();
  modalHistory.push('/workbench/dashboard/tickets/120055');
  return renderComponent(
    <Route path="/workbench/dashboard/tickets/:ticketId">
      <TicketModal />
    </Route>,
    store,
    modalHistory
  );
}
function renderTicketsHistoryComponent(store) {
  return renderComponent(<TicketHistory ticketId="120055" />, store);
}
// mock as we use scrollIntoView in TicketModal
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('TicketModal', () => {
  it('renders spinner and detail/history content', async () => {
    const store = mockStore({
      ...ticketAttachmentSettings,
    });

    renderTicketsModalComponent(store);

    expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument();

    //Render title from ticket detail
    expect(await screen.findByText(/Test Ticket Subject/i)).toBeInTheDocument();

    //Render reply text from ticket history
    const statusChangeText = await screen.findAllByText(/Status Changed/i);
    expect(statusChangeText.length).toBeGreaterThanOrEqual(1);
  });
});

describe('TicketHistory', () => {
  it('should show a attachment', async () => {
    const store = mockStore({});
    renderTicketsHistoryComponent(store);
    expect(
      await screen.findByText(
        'Screen Shot 2021-09-27 at 12.45.03 PM.png (46.2k)'
      )
    ).toBeInTheDocument();
  });
});
