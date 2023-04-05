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
  yield put({ type: 'LOAD_PROFILE_DATA' });
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

export function* watchProfileData() {
  yield takeLatest('GET_PROFILE_DATA', getProfileData);
}

export default [watchProfileData()];
