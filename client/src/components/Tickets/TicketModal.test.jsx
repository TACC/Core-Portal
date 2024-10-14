import React from 'react';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { default as TicketModal, TicketHistory } from './TicketModal';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';
import renderComponent from 'utils/testing';

const mockStore = configureStore();
const initialMockState = {
  ticketId: null,
  ticketSubject: null,
  ticketSubjectLoading: false,
  ticketSubjectError: false,
  content: [],
  showItems: [],
  loading: false,
  loadingError: false,
  loadingErrorMessage: '',
  replying: false,
  replyingError: false,
  replyingErrorMessage: '',
  attachments: [],
};

const ticketAttachmentSettings = {
  workbench: {
    config: {
      ticketAttachmentMaxSizeMessage: 'Max File Size: 3MB',
      ticketAttachmentMaxSize: 3145728,
    },
  },
};

const exampleTicketHistory = [
  {
    id: '1',
    Type: 'create',
    Content: 'ticket creation content from user',
    IsCreator: true,
    Creator: 'Max Munstermann',
    Created: 'Fri Mar 22 09:17:27 2019',
    Attachments: [[1315069, 'untitled (0b)']],
    Ticket: '1',
  },
  {
    id: '2',
    Type: 'Correspond',
    Content: 'this is admin reply content',
    IsCreator: false,
    Creator: 'Ad Min',
    Created: 'Fri Mar 23 10:17:00 2019',
    Attachments: [[1315069, 'untitled (0b)']],
    Ticket: '2',
  },
];
const exampleTicketHistoryCard = [
  {
    id: '2077239',
    Created: '2021-09-27T14:10:57',
    Creator: 'william',
    IsCreator: true,
    Content: '1 attachment',
    Attachments: [
      [1315069, 'untitled (0b)'],
      [1315070, 'untitled (50b)'],
      [1315071, 'Screen Shot 2021-09-27 at 12.45.03 PM.png (46.2k)'],
    ],
    Ticket: '2077239',
  },
];
function renderTicketsModelComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <TicketModal />
      </BrowserRouter>
    </Provider>
  );
}
function renderTicketsHistoryComponent(store) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <TicketHistory />
      </BrowserRouter>
    </Provider>
  );
}
// mock as we use scrollIntoView in TicketModal
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('TicketModal', () => {
  it('render modal', () => {
    const store = mockStore({
      ticketDetailedView: {
        ...initialMockState,
        ticketId: 42,
        ticketSubject: 'Subject',
        content: exampleTicketHistory,
      },
      ...ticketAttachmentSettings,
    });

    const { getByText, getAllByText } = renderTicketsModelComponent(store);
    /* for FP-251: expect(getByText(/42/)).toBeInTheDocument(); */
    expect(getByText(/Subject/)).toBeInTheDocument();
    expect(getAllByText(/ticket creation content from user/)).toBeDefined();
    expect(getAllByText(/this is admin reply content/)).toBeDefined();
  });

  it('renders spinner when loading ticket history', () => {
    const store = mockStore({
      ticketDetailedView: {
        ...initialMockState,
        ticketId: 42,
        ticketSubject: 'Subject',
        loading: true,
      },
      ...ticketAttachmentSettings,
    });

    const { getByText, getByTestId } = renderTicketsModelComponent(store);
    /* for FP-251: expect(getByText(/42/)).toBeInTheDocument(); */
    expect(getByText(/Subject/)).toBeInTheDocument();
    expect(getByTestId('loading-spinner'));
  });
});
describe('Attachment', () => {
  it('should show a attachment', () => {
    const store = mockStore({
      ticketDetailedView: {
        ...initialMockState,
        ticketId: 42,
        ticketSubject: 'Subject',
        content: exampleTicketHistoryCard,
      },
    });
    const { getAllByText } = renderTicketsHistoryComponent(store);
    expect(
      getAllByText('Screen Shot 2021-09-27 at 12.45.03 PM.png (46.2k)')
    ).toBeDefined();
  });
});
