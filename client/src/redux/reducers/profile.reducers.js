const initialState = {
  isLoading: true,
  data: {}
};
export default function profile(state = initialState, action) {
  switch (action.type) {
    case 'ADD_PROFILE_DATA':
      return { ...state, isLoading: false, data: { ...action.payload } };
    default:
      return state;
  }
}
