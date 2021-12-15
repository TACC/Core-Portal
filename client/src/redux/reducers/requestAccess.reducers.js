export const initialRequestAccessState = {
  loading: false,
  error: null,
  ticketId: null
};

export default function requestAccess(
  state = initialRequestAccessState,
  action
) {
  switch (action.type) {
    case 'REQUEST_ACCESS_INIT':
      return initialRequestAccessState;
    case 'REQUEST_ACCESS_STARTED':
      return {
        ...state,
        loading: true
      };
    case 'REQUEST_ACCESS_FAILED':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'REQUEST_ACCESS_SUCCESS':
      return {
        ...state,
        loading: false,
        createdTicketId: action.payload
      };
    default:
      return state;
  }
}
