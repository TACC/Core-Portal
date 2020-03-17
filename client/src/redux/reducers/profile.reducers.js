export const initialState = {
  isLoading: true,
  checkingPassword: false,
  data: {
    demographics: {},
    licenses: [],
    integrations: []
  },
  fields: {},
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
    case 'POPULATE_FIELDS':
      return { ...state, fields: action.payload };
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
    case 'CHECKING_PASSWORD':
      return {
        ...state,
        checkingPassword: true
      };
    case 'CHECKED_PASSWORD':
      return {
        ...state,
        checkingPassword: false
      };
    default:
      return state;
  }
}
