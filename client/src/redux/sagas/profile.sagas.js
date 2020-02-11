import { put, takeLatest, call, all } from 'redux-saga/effects';
import 'cross-fetch';

export function* getProfileData(action) {
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
  yield put({ type: 'GET_FORM_FIELDS' });
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
