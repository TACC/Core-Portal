import {
  ticketCreate,
  ticketCreateModal,
  initialTicketCreateState,
  initialTicketCreateModalState
} from '../tickets.reducers';

describe('ticketCreate Reducer', () => {
  test('Ticket creation initialization', () => {
    expect(
      ticketCreate(initialTicketCreateState, { type: `TICKET_CREATE_INIT` })
    ).toEqual(initialTicketCreateState);
  });

  test('Ticket creation started', () => {
    expect(
      ticketCreate(initialTicketCreateState, { type: `TICKET_CREATE_STARTED` })
    ).toEqual({ ...initialTicketCreateState, creating: true });
  });

  test('Ticket creation success', () => {
    expect(
      ticketCreate(initialTicketCreateState, {
        type: `TICKET_CREATE_SUCCESS`,
        payload: 42
      })
    ).toEqual({
      creating: false,
      creatingError: false,
      creatingErrorMessage: '',
      creatingSuccess: true,
      createdTicketId: 42
    });
  });

  test('Ticket creation failed', () => {
    expect(
      ticketCreate(initialTicketCreateState, {
        type: `TICKET_CREATE_FAILED`,
        payload: 'failed message'
      })
    ).toEqual({
      creating: false,
      creatingError: true,
      creatingErrorMessage: 'failed message',
      creatingSuccess: false,
      createdTicketId: null
    });
  });
});

describe('TicketCreateModal Reducer', () => {
  test('Ticket creation modal is opened with default parameters', () => {
    expect(
      ticketCreateModal(initialTicketCreateModalState, {
        type: `TICKET_CREATE_SET_MODAL_OPEN`,
        payload: {}
      })
    ).toEqual({
      modalOpen: true,
      subject: '',
      showAsModalOnDashboard: true,
      provideDashBoardLinkOnSuccess: true
    });
  });
  test('Ticket creation modal is opened with custum parameters', () => {
    expect(
      ticketCreateModal(initialTicketCreateModalState, {
        type: `TICKET_CREATE_SET_MODAL_OPEN`,
        payload: {
          subject: 'my custom subject',
          showAsModalOnDashboard: false,
          provideDashBoardLinkOnSuccess: false
        }
      })
    ).toEqual({
      modalOpen: true,
      subject: 'my custom subject',
      showAsModalOnDashboard: false,
      provideDashBoardLinkOnSuccess: false
    });
  });
  test('Ticket creation modal is closed', () => {
    expect(
      ticketCreateModal(initialTicketCreateModalState, {
        type: `TICKET_CREATE_SET_MODAL_CLOSE`
      })
    ).toEqual({
      ...initialTicketCreateModalState,
      modalOpen: false,
    });
  });
});
