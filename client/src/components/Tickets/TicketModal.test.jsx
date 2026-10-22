import React from 'react';
import { vi } from 'vitest';
import { createMemoryHistory } from 'history';
import { screen } from '@testing-library/react';
import { default as TicketModal, TicketHistory } from './TicketModal';
import configureStore from 'redux-mock-store';
import { Route, Routes } from 'react-router-dom';
import renderComponent from 'utils/testing';

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
  return renderComponent(<TicketModal ticketId={120055} />, store);
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
