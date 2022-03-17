import profileReducer, { initialState } from '../profile.reducers';

describe('Profile/Manage Account Reducer', () => {
  test('Load initial state', () => {
    expect(profileReducer(initialState, { type: undefined })).toEqual(
      initialState
    );
  });
  test('Loading actions', () => {
    const loadingProfileData = {
      type: 'LOAD_PROFILE_DATA',
    };
    expect(profileReducer(initialState, loadingProfileData)).toEqual({
      ...initialState,
      isLoading: true,
      errors: { data: undefined },
    });

    const editingInformation = {
      type: 'EDITING_INFORMATION',
    };
    expect(profileReducer(initialState, editingInformation)).toEqual({
      ...initialState,
      editing: true,
    });

    const checkingPassword = {
      type: 'CHECKING_PASSWORD',
    };
    expect(profileReducer(initialState, checkingPassword)).toEqual({
      ...initialState,
      success: { ...initialState.success, password: false },
      checkingPassword: true,
    });
  });
  test('Form submission actions', () => {
    const editInformationSuccess = {
      type: 'EDIT_INFORMATION_SUCCESS',
      payload: {
        required: true,
        optional: true,
      },
    };
    expect(profileReducer(initialState, editInformationSuccess)).toEqual({
      ...initialState,
      editing: false,
      success: { ...initialState.success, required: true, optional: true },
    });

    const checkedPassword = {
      type: 'CHECKED_PASSWORD',
    };
    expect(profileReducer(initialState, checkedPassword)).toEqual({
      ...initialState,
      checkingPassword: false,
      errors: {
        password: undefined,
      },
    });

    const changedPassword = {
      type: 'CHANGED_PASSWORD',
    };
    expect(profileReducer(initialState, changedPassword)).toEqual({
      ...initialState,
      success: {
        required: false,
        optional: false,
        password: true,
      },
    });
  });
  test('Storing actions', () => {
    const addData = {
      type: 'ADD_DATA',
      payload: {
        demographics: {},
        integrations: [],
        licenses: [],
        passwordLastChanged: '',
      },
    };
    expect(profileReducer(initialState, addData)).toEqual({
      ...initialState,
      isLoading: false,
      data: {
        demographics: {},
        integrations: [],
        licenses: [],
        passwordLastChanged: '',
      },
    });

    const populateFields = {
      type: 'POPULATE_FIELDS',
      payload: {
        test: 'field',
      },
    };
    expect(profileReducer(initialState, populateFields)).toEqual({
      ...initialState,
      fields: {
        test: 'field',
      },
      errors: {
        fields: undefined,
      },
    });
  });
  test('Modal actions', () => {
    const closeAllModals = {
      type: 'CLOSE_PROFILE_MODAL',
      payload: {
        editRequired: false,
        editOptional: false,
        changePW: false,
      },
    };
    expect(profileReducer(initialState, closeAllModals)).toEqual({
      ...initialState,
      modals: {
        editRequired: false,
        editOptional: false,
        changePW: false,
      },
    });

    const openAllModals = {
      type: 'OPEN_PROFILE_MODAL',
      payload: {
        required: true,
        optional: true,
        password: true,
      },
    };
    expect(profileReducer(initialState, openAllModals)).toEqual({
      ...initialState,
      modals: {
        required: true,
        optional: true,
        password: true,
      },
    });
  });
  test('Error actions', () => {
    const addDataError = {
      type: 'ADD_DATA_ERROR',
      payload: new Error('Add data error'),
    };
    expect(profileReducer(initialState, addDataError)).toEqual({
      ...initialState,
      isLoading: false,
      errors: {
        data: Error('Add data error'),
      },
    });

    const populateFieldsError = {
      type: 'POPULATE_FIELDS_ERROR',
      payload: new Error('Populate Fields Error'),
    };
    expect(profileReducer(initialState, populateFieldsError)).toEqual({
      ...initialState,
      errors: { fields: Error('Populate Fields Error') },
    });

    const editInformationError = {
      type: 'EDIT_INFORMATION_ERROR',
      payload: { editing: new Error('Edit information error') },
    };
    expect(profileReducer(initialState, editInformationError)).toEqual({
      ...initialState,
      editing: false,
      errors: { editing: Error('Edit information error') },
    });

    const editPasswordError = {
      type: 'PASSWORD_ERROR',
      payload: new Error('Incorrect password'),
    };
    expect(profileReducer(initialState, editPasswordError)).toEqual({
      ...initialState,
      errors: {
        password: Error('Incorrect password'),
      },
    });
  });
});
