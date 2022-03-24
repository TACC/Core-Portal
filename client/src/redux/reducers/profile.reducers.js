export const initialState = {
  isLoading: true,
  checkingPassword: false,
  editing: false,
  success: { optional: false, required: false, password: false },
  data: {
    demographics: {},
    licenses: [],
    integrations: [],
    passwordLastChanged: '',
  },
  errors: {},
  fields: {},
  modals: {
    required: false,
    optional: false,
    password: false,
  },
};
export default function profile(state = initialState, action) {
  switch (action.type) {
    case 'LOAD_PROFILE_DATA':
      return {
        ...state,
        isLoading: true,
        errors: { ...state.errors, data: undefined },
      };
    case 'ADD_DATA':
      return {
        ...state,
        isLoading: false,
        data: { ...state.data, ...action.payload },
      };
    case 'ADD_DATA_ERROR':
      return {
        ...state,
        isLoading: false,
        errors: {
          ...state.errors,
          data: action.payload,
        },
      };
    case 'POPULATE_FIELDS':
      return {
        ...state,
        fields: action.payload,
        errors: { ...state.errors, fields: undefined },
      };
    case 'POPULATE_FIELDS_ERROR':
      return { ...state, errors: { ...state.errors, fields: action.payload } };
    case 'OPEN_PROFILE_MODAL':
      return { ...state, modals: { ...state.modals, ...action.payload } };
    case 'CLOSE_PROFILE_MODAL':
      return {
        ...state,
        errors: {},
        success: { optional: false, required: false, password: false },
        modals: {
          editRequired: false,
          editOptional: false,
          changePW: false,
        },
      };
    case 'EDITING_INFORMATION':
      return { ...state, editing: true };
    case 'EDIT_INFORMATION_SUCCESS': {
      return {
        ...state,
        editing: false,
        success: { ...state.success, ...action.payload },
      };
    }
    case 'EDIT_INFORMATION_ERROR':
      return {
        ...state,
        editing: false,
        errors: { ...state.errors, ...action.payload },
      };
    case 'CHECKING_PASSWORD':
      return {
        ...state,
        success: { ...state.success, password: false },
        checkingPassword: true,
      };
    case 'CHECKED_PASSWORD':
      return {
        ...state,
        checkingPassword: false,
        errors: {
          ...state.errors,
          password: undefined,
        },
      };
    case 'CHANGED_PASSWORD':
      return {
        ...state,
        success: {
          ...state.success,
          password: true,
        },
      };
    case 'PASSWORD_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          password: action.payload,
        },
      };
    case 'CLEAR_FORM_MESSAGES':
      return {
        ...state,
        success: { optional: false, required: false, password: false },
        errors: {},
      };
    default:
      return state;
  }
}
