export const initialState = {
  user: null
};

export default function authenticatedUser(state = initialState, action) {
  switch (action.type) {
    case 'AUTHENTICATED_USER_SUCCESS':
      return {
        user: action.payload
      };
    default:
      return state;
  }
}
