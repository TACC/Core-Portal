import fetch from 'cross-fetch';
import { expectSaga, testSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import { fetchUtil } from '../../utils/fetchUtil';
import profileReducer, { initialState } from '../reducers/profile.reducers';
import {
  getPasswordStatus,
  getProfileData,
  watchProfileData,
  getFormFields,
  watchFormFields,
  changePassword,
  watchChangePassword,
  editOptionalInformation,
  watchEditOptional,
  editRequiredInformation,
  watchEditRequired,
} from './profile.sagas';

jest.mock('cross-fetch');

describe('Utility Functions', () => {
  it('should get the last date the password was changed', () => {
    const historyFixture = [
      {
        actor: 'Test User',
        comment: 'Password changed by user.',
        status: 'Active',
        timestamp: '2020-06-01T12:00:08Z',
      },
    ];
    expect(getPasswordStatus(historyFixture)).toBeDefined();
    expect(getPasswordStatus(historyFixture)).toEqual('6/1/2020');
  });

  it("should return empty string if the user's password has never been changed", () => {
    const historyFixture = [
      {
        actor: 'Test User',
        comment: 'User reqested account',
        status: 'PendingEmailConfirmation',
        timestamp: '2020-06-01T12:00:08Z',
      },
    ];
    expect(getPasswordStatus(historyFixture)).toBeDefined();
    expect(getPasswordStatus(historyFixture)).toEqual('');
  });
});

describe('getProfileData Saga', () => {
  const fakeProfileData = {
    demographics: {},
    integrations: {},
    licenses: [],
    passwordLastChanged: '6/1/2020',
  };

  it("should fetch a user's profile data and add it to the state", () =>
    expectSaga(getProfileData)
      .withReducer(profileReducer)

      .provide([
        [
          matchers.call.fn(fetchUtil, { url: '/accounts/api/profile/data/' }),
          {
            demographics: {},
            history: [
              {
                actor: 'Test User',
                comment: 'Password changed by user.',
                status: 'Active',
                timestamp: '2020-06-01T12:00:08Z',
              },
            ],
            integrations: {},
            licenses: [],
          },
        ],
      ])
      .put({ type: 'LOAD_PROFILE_DATA' })
      .put({ type: 'GET_FORM_FIELDS' })
      .call(fetchUtil, { url: '/accounts/api/profile/data/' })
      .put({
        type: 'ADD_DATA',
        payload: fakeProfileData,
      })
      .hasFinalState({
        ...initialState,
        isLoading: false,
        data: fakeProfileData,
      })
      .run());

  it('should handle errors and store them in the state', () => {
    const fakeError = new Error('Unable to fetch profile data');
    return expectSaga(getProfileData)
      .withReducer(profileReducer)
      .put({ type: 'GET_FORM_FIELDS' })
      .provide([
        [
          matchers.call.fn(fetchUtil, { url: '/accounts/api/profile/data/' }),
          throwError(fakeError),
        ],
      ])
      .call(fetchUtil, { url: '/accounts/api/profile/data/' })
      .put({ type: 'ADD_DATA_ERROR', payload: fakeError })
      .hasFinalState({
        ...initialState,
        isLoading: false,
        errors: {
          data: fakeError,
        },
      })
      .run();
  });
});

describe('getFormFields Saga', () => {
  const fakeFieldData = {
    countries: [],
    ethnicities: [],
    genders: [],
    institutions: [],
    professionalLevels: [],
    titles: [],
  };

  it('should fetch form field data and add it to the state', () =>
    expectSaga(getFormFields)
      .withReducer(profileReducer)
      .provide([
        [
          matchers.call.fn(fetchUtil, { url: '/accounts/api/profile/fields/' }),
          fakeFieldData,
        ],
      ])
      .call(fetchUtil, { url: '/accounts/api/profile/fields/' })
      .put({ type: 'POPULATE_FIELDS', payload: fakeFieldData })
      .hasFinalState({
        ...initialState,
        errors: { fields: undefined },
        fields: fakeFieldData,
      })
      .run());

  it('should handle errors and store them in the fields portion of the state', () => {
    const fakeError = new Error('Unable to fetch form field data');
    return expectSaga(getFormFields)
      .withReducer(profileReducer)
      .provide([
        [
          matchers.call.fn(fetchUtil, { url: '/accounts/api/profile/fields/' }),
          throwError(fakeError),
        ],
      ])
      .call(fetchUtil, { url: '/accounts/api/profile/fields/' })
      .put({ type: 'POPULATE_FIELDS_ERROR', payload: fakeError })
      .hasFinalState({
        ...initialState,
        errors: {
          fields: fakeError,
        },
      })
      .run();
  });
});

describe('Change Password Form', () => {
  const action = {
    values: {},
  };
  const params = {
    url: `/accounts/api/profile/change-password/`,
    method: 'PUT',
    body: JSON.stringify(action.values),
  };

  test('Change Password Form Submission', () => {
    return expectSaga(changePassword, action)
      .withReducer(profileReducer)
      .provide([[matchers.call.fn(fetchUtil, params), {}]])
      .call(fetchUtil, params)
      .put({ type: 'CHECKED_PASSWORD' })
      .put({ type: 'CHANGED_PASSWORD' })
      .hasFinalState({
        ...initialState,
        success: { ...initialState.success, password: true },
        errors: { ...initialState.errors, password: undefined },
      })
      .run();
  });

  it('should add errors to the state', () => {
    const fakeError = new Error('Incorrect password');
    return expectSaga(changePassword, action)
      .withReducer(profileReducer)
      .provide([[matchers.call.fn(fetchUtil, params), throwError(fakeError)]])
      .call(fetchUtil, params)
      .put({ type: 'CHECKED_PASSWORD' })
      .put({ type: 'PASSWORD_ERROR', payload: fakeError })
      .hasFinalState({
        ...initialState,
        errors: { ...initialState.errors, password: fakeError },
      })
      .run();
  });
});

describe('Edit Optional Information Form', () => {
  const action = {
    values: {
      professionalLevel: '',
      bio: '',
      orcidId: '',
      website: '',
    },
  };

  const params = {
    url: '/accounts/api/profile/edit-profile/',
    method: 'PUT',
    body: JSON.stringify({
      flag: 'Optional',
      professional_level: action.values.professionalLevel,
      orcid_id: action.values.orcidId,
      website: action.values.website,
      bio: action.values.bio,
    }),
  };
  const fakeError = new Error('Unable to edit optional information');
  it('should make an API call and store the success status in the state', () =>
    expectSaga(editOptionalInformation, action)
      .withReducer(profileReducer)
      .provide([[matchers.call.fn(fetchUtil, params)]])
      .call(fetchUtil, params)
      .put({
        type: 'EDIT_INFORMATION_SUCCESS',
        payload: { optional: true },
      })
      .hasFinalState({
        ...initialState,
        success: { ...initialState.success, optional: true },
      })
      .run());
  it('should store errors in the state', () =>
    expectSaga(editOptionalInformation, action)
      .withReducer(profileReducer)
      .provide([[matchers.call.fn(fetchUtil, params), throwError(fakeError)]])
      .call(fetchUtil, params)
      .put({
        type: 'EDIT_INFORMATION_ERROR',
        payload: { optional: fakeError },
      })
      .run());
});

describe('Edit Required Information Form', () => {
  const action = {
    values: {
      citizenship: 1,
      citizenshipId: 1,
      country: 1,
      countryId: 1,
      email: '',
      ethnicity: '',
      firstName: '',
      lastName: '',
      gender: '',
      institution: 1,
      institutionId: 1,
      phone: '',
      title: '',
    },
  };

  const params = {
    url: '/accounts/api/profile/edit-profile/',
    method: 'PUT',
    body: JSON.stringify({
      flag: 'Required',
      ...action.values,
    }),
  };
  const fakeError = new Error('Unable to edit optional information');
  it('should make an API call and store the success status in the state', () =>
    expectSaga(editRequiredInformation, action)
      .withReducer(profileReducer)
      .provide([[matchers.call.fn(fetchUtil, params)]])
      .call(fetchUtil, params)
      .put({
        type: 'EDIT_INFORMATION_SUCCESS',
        payload: { required: true },
      })
      .hasFinalState({
        ...initialState,
        success: { ...initialState.success, required: true },
      })
      .run());
  it('should store errors in the state', () =>
    expectSaga(editRequiredInformation, action)
      .withReducer(profileReducer)
      .provide([[matchers.call.fn(fetchUtil, params), throwError(fakeError)]])
      .call(fetchUtil, params)
      .put({
        type: 'EDIT_INFORMATION_ERROR',
        payload: { required: fakeError },
      })
      .run());
});

test('Effect Creators should dispatch sagas', () => {
  testSaga(watchChangePassword)
    .next()
    .takeLatest('CHANGE_PASSWORD', changePassword)
    .next()
    .isDone();

  testSaga(watchEditOptional)
    .next()
    .takeLatest('EDIT_OPTIONAL_INFORMATION', editOptionalInformation)
    .next()
    .isDone();

  testSaga(watchEditRequired)
    .next()
    .takeLatest('EDIT_REQUIRED_INFORMATION', editRequiredInformation)
    .next()
    .isDone();

  testSaga(watchFormFields)
    .next()
    .takeLatest('GET_FORM_FIELDS', getFormFields)
    .next()
    .isDone();

  testSaga(watchProfileData)
    .next()
    .takeLatest('GET_PROFILE_DATA', getProfileData)
    .next()
    .isDone();
});
