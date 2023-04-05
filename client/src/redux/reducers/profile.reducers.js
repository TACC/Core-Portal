export const initialState = {
  isLoading: true,
  checkingPassword: false,
  data: {
    demographics: {},
    licenses: [],
    integrations: [],
    passwordLastChanged: '',
  },
  errors: {},
};
export default function profile(state = initialState, action) {
  switch (action.type) {
    case 'LOAD_PROFILE_DATA':
      return initialState;
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
    default:
      return state;
  }
}
