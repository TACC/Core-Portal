const initialTicketHistory = {
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

export default function ticketHistory(state = initialTicketHistory, action) {
  switch (action.type) {
    case 'FETCH_TICKET_HISTORY':
      return {
        ...initialTicketHistory,
        loading: true,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'FETCH_TICKET_HISTORY_SUCCESS':
      return {
        ...state,
        content: action.payload,
        loading: false,
        loadingError: false,
        loadingErrorMessage: ''
      };
    case 'FETCH_TICKET_HISTORY_ERROR':
      return {
        ...state,
        loadingError: true,
        loadingErrorMessage: action.payload,
        loading: false
      };
    case 'TICKET_HISTORY_TOGGLE_SHOW_ITEM':
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
    case 'POST_TICKET_HISTORY_REPLY_STARTED':
      return {
        ...state,
        replying: true,
        replyingError: false,
        replyingErrorMessage: ''
      };
    case 'POST_TICKET_HISTORY_REPLY_SUCCESS':
      return {
        ...state,
        replying: false,
        content: [...state.content, action.payload]
      };
    case 'POST_TICKET_HISTORY_REPLY_FAILED':
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
