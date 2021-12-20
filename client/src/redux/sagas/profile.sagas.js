import { put, takeLatest, call } from 'redux-saga/effects';
import { omit, isEmpty } from 'lodash';
import { fetchUtil } from 'utils/fetchUtil';

const ROOT_SLUG = '/accounts/api/profile';

export const getPasswordStatus = (h) => {
  const passwordChanged = h.filter((entry) =>
    entry.comment.includes('Password changed')
  );
  if (isEmpty(passwordChanged)) return '';
  const lastChanged = passwordChanged.pop().timestamp;
  const output = new Date(lastChanged).toLocaleDateString();
  return output;
};

export function* getProfileData(action) {
  yield put({ type: 'GET_FORM_FIELDS' });
  try {
    const response = yield call(fetchUtil, {
      url: `${ROOT_SLUG}/data/`,
    });
    const passwordLastChanged = getPasswordStatus(response.history);
    yield put({
      type: 'ADD_DATA',
      payload: { ...omit(response, 'history'), passwordLastChanged },
    });
  } catch (error) {
    yield put({ type: 'ADD_DATA_ERROR', payload: error });
  }
}

export function* getFormFields(action) {
  try {
    const response = yield call(fetchUtil, { url: `${ROOT_SLUG}/fields/` });
    yield put({ type: 'POPULATE_FIELDS', payload: response });
  } catch (error) {
    yield put({ type: 'POPULATE_FIELDS_ERROR', payload: error });
  }
}

export function* changePassword(action) {
  yield put({ type: 'CHECKING_PASSWORD' });
  try {
    yield call(fetchUtil, {
      url: `${ROOT_SLUG}/change-password/`,
      method: 'PUT',
      body: JSON.stringify(action.values),
    });
    yield put({ type: 'CHECKED_PASSWORD' });
    yield put({ type: 'CHANGED_PASSWORD' });
  } catch (error) {
    yield put({ type: 'CHECKED_PASSWORD' });
    yield put({ type: 'PASSWORD_ERROR', payload: error });
  }
}

export function* editRequiredInformation(action) {
  yield put({ type: 'EDITING_INFORMATION' });
  try {
    yield call(fetchUtil, {
      url: `${ROOT_SLUG}/edit-profile/`,
      method: 'PUT',
      body: JSON.stringify({
        flag: 'Required',
        ...action.values,
      }),
    });
    yield put({
      type: 'EDIT_INFORMATION_SUCCESS',
      payload: { required: true },
    });
  } catch (error) {
    yield put({ type: 'EDIT_INFORMATION_ERROR', payload: { required: error } });
  }
}

export function* editOptionalInformation(action) {
  yield put({ type: 'EDITING_INFORMATION' });
  const { professionalLevel, website, orcidId, bio } = yield action.values;
  try {
    yield call(fetchUtil, {
      url: `${ROOT_SLUG}/edit-profile/`,
      method: 'PUT',
      body: JSON.stringify({
        flag: 'Optional',
        professional_level: professionalLevel,
        orcid_id: orcidId,
        website,
        bio,
      }),
    });
    yield put({
      type: 'EDIT_INFORMATION_SUCCESS',
      payload: { optional: true },
    });
  } catch (error) {
    yield put({ type: 'EDIT_INFORMATION_ERROR', payload: { optional: error } });
  }
}

export function* watchEditRequired() {
  yield takeLatest('EDIT_REQUIRED_INFORMATION', editRequiredInformation);
}
export function* watchEditOptional() {
  yield takeLatest('EDIT_OPTIONAL_INFORMATION', editOptionalInformation);
}
export function* watchChangePassword() {
  yield takeLatest('CHANGE_PASSWORD', changePassword);
}
export function* watchFormFields() {
  yield takeLatest('GET_FORM_FIELDS', getFormFields);
}
export function* watchProfileData() {
  yield takeLatest('GET_PROFILE_DATA', getProfileData);
}

export default [
  watchEditRequired(),
  watchEditOptional(),
  watchChangePassword(),
  watchFormFields(),
  watchProfileData(),
];
