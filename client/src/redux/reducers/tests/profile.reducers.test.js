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
    expect(profileReducer(initialState, loadingProfileData)).toEqual(
      initialState
    );

    const checkingPassword = {
      type: 'CHECKING_PASSWORD',
    };
    expect(profileReducer(initialState, checkingPassword)).toEqual({
      ...initialState,
      success: { ...initialState.success, password: false },
      checkingPassword: true,
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
  });
});
