export const initialTicketList = {
  content: [],
  loading: false,
  loadingError: false,
  loadingErrorMessage: ''
};

export function ticketList(state = initialTicketList, action) {
  switch (action.type) {
    case 'TICKET_LIST_FETCH_STARTED':
      return {
        ...state,
        content: [],
        loading: true,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'TICKET_LIST_FETCH_SUCCESS':
      return {
        ...state,
        content: action.payload,
        loading: false,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'TICKET_LIST_FETCH_ERROR':
      return {
        ...state,
        content: [],
        loadingError: true,
        loadingErrorMessage: action.payload,
        loading: false
      };
    default:
      return state;
  }
}

const initialDetailedTicketView = {
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
  replyingErrorMessage: ''
};

let showItemSet;

export function ticketDetailedView(state = initialDetailedTicketView, action) {
  switch (action.type) {
    case 'TICKET_DETAILED_VIEW_INIT_MODAL':
      return {
        ...initialDetailedTicketView,
        ticketId: action.payload.ticketId
      };
    case 'TICKET_DETAILED_VIEW_FETCH_HISTORY_STARTED':
      return {
        ...state,
        loading: true,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'TICKET_DETAILED_VIEW_FETCH_HISTORY_SUCCESS':
      return {
        ...state,
        content: action.payload,
        loading: false,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'TICKET_DETAILED_VIEW_FETCH_HISTORY_ERROR':
      return {
        ...state,
        loadingError: true,
        loadingErrorMessage: action.payload,
        loading: false
      };
    case 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT_STARTED':
      return {
        ...state,
        ticketSubjectLoading: true
      };
    case 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT_SUCCESS':
      return {
        ...state,
        ticketSubject: action.payload,
        ticketSubjectLoading: false,
        ticketSubjectError: false
      };
    case 'TICKET_DETAILED_VIEW_FETCH_TICKET_SUBJECT_ERROR':
      return {
        ...state,
        ticketSubjectLoading: false,
        ticketSubjectError: true
      };
    case 'TICKET_DETAILED_VIEW_TOGGLE_SHOW_ITEM':
      showItemSet = new Set(state.showItems);
      if (state.showItems.includes(action.payload.index)) {
        showItemSet.delete(action.payload.index);
      } else {
        showItemSet.add(action.payload.index);
      }

      return {
        ...state,
        showItems: [...showItemSet.values()]
      };
    case 'TICKET_DETAILED_VIEW_REPLY_STARTED':
      return {
        ...state,
        replying: true,
        replyingError: false,
        replyingErrorMessage: ''
      };
    case 'TICKET_DETAILED_VIEW_REPLY_SUCCESS':
      return {
        ...state,
        replying: false,
        content: [...state.content, action.payload]
      };
    case 'TICKET_DETAILED_VIEW_REPLY_FAILED':
      return {
        ...state,
        replying: false,
        replyingError: true,
        replyingErrorMessage: action.payload
      };
    default:
      return state;
  }
}

export const initialTicketCreateState = {
  creating: false,
  creatingError: false,
  creatingErrorMessage: '',
  creatingSuccess: false,
  createdTicketId: null
};

export function ticketCreate(state = initialTicketCreateState, action) {
  switch (action.type) {
    case 'TICKET_CREATE_INIT':
      return initialTicketCreateState;
    case 'TICKET_CREATE_STARTED':
      return {
        ...state,
        creating: true
      };
    case 'TICKET_CREATE_FAILED':
      return {
        ...state,
        creating: false,
        creatingError: true,
        creatingErrorMessage: action.payload
      };
    case 'TICKET_CREATE_SUCCESS':
      return {
        ...state,
        creating: false,
        creatingSuccess: true,
        createdTicketId: action.payload
      };
    default:
      return state;
  }
}

export const initialTicketCreateModalState = {
  modalOpen: false,
  subject: '',
  showAsModalOnDashboard: true,
  provideDashBoardLinkOnSuccess: true,
  sitekey: ''
};

export function ticketCreateModal(
  state = initialTicketCreateModalState,
  action
) {
  switch (action.type) {
    case 'TICKET_CREATE_SET_MODAL_OPEN':
      return {
        ...state,
        ...action.payload.CreateTicketModal,
        modalOpen: true,
        sitekey: action.payload.sitekey
      };
    case 'TICKET_CREATE_SET_MODAL_CLOSE':
      return {
        ...initialTicketCreateModalState
      };
    default:
      return state;
  }
}
