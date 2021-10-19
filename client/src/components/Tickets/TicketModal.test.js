import React from 'react';
import { render } from '@testing-library/react';
import TicketModal from './TicketModal';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom/extend-expect';
import { BrowserRouter } from 'react-router-dom';

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
};

const exampleTicketHistory = [
  {
    id: '1',
    Type: 'create',
    Content: 'ticket creation content from user',
    IsCreator: true,
    Creator: 'Max Munstermann',
    Created: 'Fri Mar 22 09:17:27 2019',
  },
  {
    id: '2',
    Type: 'Correspond',
    Content: 'this is admin reply content',
    IsCreator: false,
    Creator: 'Ad Min',
    Created: 'Fri Mar 23 10:17:00 2019',
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

// mock as we use scrollIntoView in TicketModal
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('TicketModal', () => {
  it('render modal', () => {
    const store = mockStore({
      ticketDetailedView: {
        ...initialMockState,
        ticketId: 42,
        ticketSubject: 'Subject',
        content: exampleTicketHistory,
      },
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
    });

    const { getByText, getByTestId } = renderTicketsModelComponent(store);
    /* for FP-251: expect(getByText(/42/)).toBeInTheDocument(); */
    expect(getByText(/Subject/)).toBeInTheDocument();
    expect(getByTestId('loading-spinner'));
  });
});
