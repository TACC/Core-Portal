import { put, takeLatest, call } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import 'cross-fetch';

const ROOT_SLUG = '/accounts/api/profile';

export function* getProfileData(action) {
  yield put({ type: 'GET_FORM_FIELDS' });
  const response = yield call(fetch, `${ROOT_SLUG}/data/`, {
    credentials: 'same-origin',
    ...action.options
  });
  const payload = yield response.json();
  yield put({ type: 'ADD_DATA', payload });
}

export function* getFormFields(action) {
  const response = yield call(fetch, `${ROOT_SLUG}/fields/`, {
    credentials: 'same-origin',
    ...action.options
  });
  const payload = yield response.json();
  yield put({ type: 'POPULATE_FIELDS', payload });
}

export function* changePassword(action) {
  const options = {
    credentials: 'same-origin',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    method: 'POST',
    body: JSON.stringify(action.values),
    ...action.options
  };
  yield put({ type: 'CHECKING_PASSWORD' });
  const response = yield call(fetch, `${ROOT_SLUG}/check/`, options);
  const { verified } = yield response.json();
  yield put({ type: 'CHECKED_PASSWORD', payload: verified });
  if (verified) {
    yield call(fetch, `${ROOT_SLUG}/change-password/`, options);
  }
}

export function* editRequiredInformation(action) {
  yield put({ type: 'CLOSE_EDIT_REQUIRED' });
  yield put({ type: 'LOAD_DATA' });
  const response = yield call(fetch, `${ROOT_SLUG}/edit-profile/`, {
    credentials: 'same-origin',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    method: 'PUT',
    body: JSON.stringify({
      flag: 'Required',
      ...action.values
    }),
    ...action.options
  });
  const json = yield response.json();
  const payload = yield {
    demographics: Object.values(json).reduce(
      (obj, val) => ({ ...obj, ...val }),
      {}
    )
  };
  yield put({ type: 'ADD_DATA', payload });
}

export function* editOptionalInformation(action) {
  const { professionalLevel, website, orcidId, bio } = yield action.values;
  yield call(fetch, `${ROOT_SLUG}/edit-profile/`, {
    credentials: 'same-origin',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    method: 'PUT',
    body: JSON.stringify({
      flag: 'Optional',
      professional_level: professionalLevel,
      orcid_id: orcidId,
      website,
      bio
    }),
    ...action.options
  });
  yield put({ type: 'CLOSE_EDIT_OPTIONAL' });
  yield put({ type: 'LOAD_DATA' });
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
  watchProfileData()
];
