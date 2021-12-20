export const initialState = {
  user: null,
};

export default function authenticatedUser(state = initialState, action) {
  switch (action.type) {
    case 'AUTHENTICATED_USER_SUCCESS':
      return {
        user: action.payload,
      };
    case 'AUTHENTICATED_USER_ERROR':
      return {
        ...state,
      };
    default:
      return state;
  }
}
