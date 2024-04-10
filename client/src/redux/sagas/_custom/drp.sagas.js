import {
  takeLatest,
  put,
  call,
} from 'redux-saga/effects';
import {
  mkdirUtil,updateMetadataUtil,
} from '../datafiles.sagas';
import { useHistory, useLocation } from 'react-router-dom';


function* executeOperation(isEdit, params, values, reloadCallback, file = null, path = '') {
  if (file && isEdit) {
    yield call(
      updateMetadataUtil,
      params.api,
      params.scheme,
      params.system,
      '/' + file.path,
      '/' + path,
      file.name,
      values.name,
      values
    );
  } else {
    yield call(
      mkdirUtil,
      params.api,
      params.scheme,
      params.system,
      path,
      values.name,
      values
    );
  }

  if (isEdit && file.path === params.path) {
    // reload to new URL if name/path is changed
    yield call (reloadCallback, values.name)
  }
  else {
    yield call(reloadCallback);
  }

  yield put({
    type: 'DATA_FILES_TOGGLE_MODAL',
    payload: {
      operation: 'dynamicform',
      props: {},
    },
  });

}

function* handleSampleData(action, isEdit) {
  const { params, values, reloadPage: reloadCallback, selectedFile } = action.payload;
  yield call(
    executeOperation, isEdit, params, {...values, data_type: 'sample'}, reloadCallback, selectedFile
  )
}

function* handleOriginData(action, isEdit) {
  const { params, values, reloadPage: reloadCallback, selectedFile, additionalData: samples } = action.payload;

  const sample = samples.find(
    (sample) => sample.id === parseInt(values.sample)
  );

  // get the path without system name
  const path = sample.path.split('/').slice(1).join('/');
  yield call(
    executeOperation, isEdit, params, { ...values, data_type: 'origin_data' }, reloadCallback, selectedFile, path
  )
}

function* handleAnalysisData(action, isEdit) {
  const { params, values, reloadPage: reloadCallback, selectedFile, additionalData: samples } = action.payload;

  let { originDataId, path, sampleId } = samples.reduce((acc, sample) => {
    const originData = sample.origin_data.find(
      (originData) => originData.id === parseInt(values.base_origin_data)
    );
    if (originData) {
      acc.originDataId = originData.id;
      acc.path = originData.path;
      acc.sampleId = sample.id;
    }
    return acc;
  }, {});

  // get the path without system name
  path = path.split('/').slice(1).join('/');
  yield call(
    executeOperation, isEdit, params, {...values, data_type: 'analysis_data', sample: sampleId, base_origin_data: originDataId}, reloadCallback, selectedFile, path
  )
}

export default function* watchDRP() {
  yield takeLatest('ADD_SAMPLE_DATA', action => handleSampleData(action, false));
  yield takeLatest('EDIT_SAMPLE_DATA', action => handleSampleData(action, true));
  yield takeLatest('ADD_ANALYSIS_DATASET', action => handleAnalysisData(action, false));
  yield takeLatest('EDIT_ANALYSIS_DATASET', action => handleAnalysisData(action, true));
  yield takeLatest('ADD_ORIGIN_DATASET', action => handleOriginData(action, false));
  yield takeLatest('EDIT_ORIGIN_DATASET', action => handleOriginData(action, true));
}
