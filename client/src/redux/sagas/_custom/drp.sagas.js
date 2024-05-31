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

  if (reloadCallback) {
    yield call(reloadCallback, path);
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

  const metadata = {
    ...values,
    data_type: 'sample',
  }

  yield call(
    executeOperation, isEdit, params, metadata, reloadCallback, selectedFile
  )
}

function* handleOriginData(action, isEdit) {
  const { params, values, reloadPage: reloadCallback, selectedFile, additionalData: { samples } } = action.payload;

  const sample = samples.find(
    (sample) => sample.id === parseInt(values.sample)
  );

  const metadata = {
    ...values,
    data_type: 'origin_data',
    sample: sample.id,
  }

  // get the path without system name
  const path = sample.path.split('/').slice(1).join('/');
  yield call(
    executeOperation, isEdit, params, metadata, reloadCallback, selectedFile, path
  )
}

function* handleAnalysisData(action, isEdit) {
  const { params, values, reloadPage: reloadCallback, selectedFile, additionalData: { samples, originDatasets } } = action.payload;

  const sample = samples.find(
    (sample) => sample.id === parseInt(values.sample)
  );

  const originData = originDatasets.find(
    (originData) => originData.id === parseInt(values.base_origin_data)
  );

  let path = originData ? originData.path : sample.path;
  path = path.split('/').slice(1).join('/')

  const metadata = {
    ...values, 
    data_type: 'analysis_data',
    sample: sample.id, 
    base_origin_data: originData ? originData.id : ''
  }

  yield call(
    executeOperation, isEdit, params, metadata, reloadCallback, selectedFile, path
  )
}

function* handleFile(action, isEdit) {

  const { params, values, reloadPage: reloadCallback, selectedFile } = action.payload;

  const metadata = {
    ...values,
    data_type: 'file',
  }

  const path = selectedFile.path.split('/').slice(0, -1).join('/')

  yield call(
    executeOperation, isEdit, params, metadata, reloadCallback, selectedFile, path
  )
}

export default function* watchDRP() {
  yield takeLatest('ADD_SAMPLE_DATA', action => handleSampleData(action, false));
  yield takeLatest('EDIT_SAMPLE_DATA', action => handleSampleData(action, true));
  yield takeLatest('ADD_ANALYSIS_DATASET', action => handleAnalysisData(action, false));
  yield takeLatest('EDIT_ANALYSIS_DATASET', action => handleAnalysisData(action, true));
  yield takeLatest('ADD_ORIGIN_DATASET', action => handleOriginData(action, false));
  yield takeLatest('EDIT_ORIGIN_DATASET', action => handleOriginData(action, true));
  yield takeLatest('EDIT_FILE', action => handleFile(action, true))
}
