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
import { mkdirUtil, renameFileUtil, updateMetadataUtil } from '../datafiles.sagas';


export function* addSampleData(action) {
  console.log('ADD SAMPLE DATA', action);

  const { params, values, reloadPage: reloadCallback } = action.payload
  yield call(mkdir, params, { ...values, data_type: 'sample' }, reloadCallback);
}

export function* editSampleData(action) {
  const { params, values, reloadPage: reloadCallback, selectedFile } = action.payload
  yield call(update, params, { ...values, data_type: 'sample' }, reloadCallback, selectedFile);
}

export function* addAnalysisDataset(action) {
  console.log('ADD ANALYSIS DATA', action);

  const { params, values, reloadPage: reloadCallback } = action.payload
  yield call(mkdir, params, { ...values, data_type: 'analysis_data' }, reloadCallback);
}

export function* editAnalysisDataset(action) {
  const { params, values, reloadPage: reloadCallback, selectedFile } = action.payload
  yield call(update, params, { ...values, data_type: 'analysis_data' }, reloadCallback, selectedFile);
}

export function* addOriginDataset(action) {
  const { params, values, reloadPage: reloadCallback } = action.payload
  yield call(mkdir, params, { ...values, data_type: 'origin_data' }, reloadCallback);
}

export function* editOriginDataset(action) {
  const { params, values, reloadPage: reloadCallback, selectedFile } = action.payload
  yield call(update, params, { ...values, data_type: 'origin_data' }, reloadCallback, selectedFile);
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

function* update(params, values, reloadCallback, file) {
  yield call(
    updateMetadataUtil,
    params.api, 
    params.scheme, 
    params.system,
    '/' + file.path, 
    file.name,
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
  yield takeLatest('EDIT_ANALYSIS_DATASET', editAnalysisDataset);
  yield takeLatest('ADD_ORIGIN_DATASET', addOriginDataset);
  yield takeLatest('EDIT_ORIGIN_DATASET', editOriginDataset);
}
