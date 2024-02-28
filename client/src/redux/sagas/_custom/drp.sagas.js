import {
    takeLatest,
    takeLeading,
    put,
    call,
    all,
    race,
    take,
    select,
  } from 'redux-saga/effects';
import { mkdirUtil } from '../datafiles.sagas';


export function* addSampleData(action) {
  console.log('ADD SAMPLE DATA', action);

  const { params, values, reloadPage: reloadCallback } = action.payload
  yield call(mkdir, params, { ...values, data_type: 'sample' }, reloadCallback);
}

// goes to rename
export function* editSampleData(action) {
  console.log('EDIT SAMPLE DATA', action);
}

export function* addAnalysisDataset(action) {
  console.log('ADD ANALYSIS DATA', action);

  const { params, values, reloadPage: reloadCallback } = action.payload
  yield call(mkdir, params, { ...values, data_type: 'analysis_data' }, reloadCallback);
}

export function* addOriginDataset(action) {
  console.log('ADD ORIGIN DATA', action);

  const { params, values, reloadPage: reloadCallback } = action.payload
  yield call(mkdir, params, { ...values, data_type: 'origin_data' }, reloadCallback);
}


function* mkdir(params, values, reloadCallback) {
  yield call(
    mkdirUtil,
    params.api,
    params.scheme,
    params.system,
    params.path,
    values.name, 
    values
  )

  yield call(reloadCallback);

  yield put({
    type: 'DATA_FILES_TOGGLE_MODAL',
    payload: {
      operation: 'dynamicform',
      props: {},
    },
  });
}

export default function* watchDRP() {
  yield takeLatest('ADD_SAMPLE_DATA', addSampleData);
  yield takeLatest('EDIT_SAMPLE_DATA', editSampleData);
  yield takeLatest('ADD_ANALYSIS_DATASET', addAnalysisDataset);
  yield takeLatest('ADD_ORIGIN_DATASET', addOriginDataset);
}
