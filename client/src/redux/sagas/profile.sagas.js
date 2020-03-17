import { put, takeLatest, call, all } from 'redux-saga/effects';
import Cookies from 'js-cookie';
import 'cross-fetch';

export function* getProfileData(action) {
  yield put({ type: 'GET_FORM_FIELDS' });
  const endpoints = [
    '/accounts/api/profile/',
    '/accounts/api/licenses/',
    '/accounts/api/applications/'
  ];
  const responses = yield all(
    endpoints.map(slug =>
      call(fetch, slug, {
        credentials: 'same-origin',
        ...action.options
      })
    )
  );
  const json = yield all(responses.map(res => res.json()));
  const payload = yield json.reduce((obj, val) => ({ ...obj, ...val }), {});
  yield put({ type: 'ADD_DATA', payload });
}

export function* changePassword(action) {
  const options = {
    credentials: 'same-origin',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
    ...action.options
  };
  yield put({ type: 'CHECKING_PASSWORD' });
  const response = yield call(fetch, '/accounts/api/check/', options);
  const { verified } = yield response.json();
  yield put({ type: 'CHECKED_PASSWORD', payload: verified });
  if (verified) {
    yield call(fetch, '/accounts/change-password/', options);
  }
}
export function* watchChangePassword() {
  yield takeLatest('CHANGE_PASSWORD', changePassword);
}

export function* getFormFields(action) {
  const response = yield call(fetch, '/accounts/api/fields', {
    credentials: 'same-origin',
    ...action.options
  });
  const payload = yield response.json();
  yield put({ type: 'POPULATE_FIELDS', payload });
}

export function* watchFormFields() {
  yield takeLatest('GET_FORM_FIELDS', getFormFields);
}
export function* watchProfileData() {
  yield takeLatest('GET_PROFILE_DATA', getProfileData);
}
