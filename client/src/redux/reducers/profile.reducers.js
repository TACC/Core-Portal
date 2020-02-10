export const initialState = {
  isLoading: true,
  data: {
    demographics: {},
    licenses: [],
    integrations: []
  },
  modals: {
    editRequired: false,
    editOptional: false,
    changePW: false
  }
};
export default function profile(state = initialState, action) {
  switch (action.type) {
    case 'ADD_DATA':
      return {
        ...state,
        isLoading: false,
        data: { ...state.data, ...action.payload }
      };
    case 'OPEN_EDIT_REQUIRED':
      return {
        ...state,
        modals: { ...state.modals, editRequired: true }
      };
    case 'CLOSE_EDIT_REQUIRED':
      return {
        ...state,
        modals: { ...state.modals, editRequired: false }
      };
    case 'OPEN_EDIT_OPTIONAL':
      return {
        ...state,
        modals: { ...state.modals, editOptional: true }
      };
    case 'CLOSE_EDIT_OPTIONAL':
      return {
        ...state,
        modals: { ...state.modals, editOptional: false }
      };
    case 'OPEN_CHANGEPW':
      return {
        ...state,
        modals: { ...state.modals, changePW: true }
      };
    case 'CLOSE_CHANGEPW':
      return {
        ...state,
        modals: { ...state.modals, changePW: false }
      };
    default:
      return state;
  }
}
