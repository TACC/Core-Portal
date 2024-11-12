import { takeLatest, put, call } from 'redux-saga/effects';
import { mkdirUtil, updateMetadataUtil } from '../datafiles.sagas';
import { useHistory, useLocation } from 'react-router-dom';
import { createEntityUtil, patchEntityUtil } from '../projects.sagas';

function* executeOperation(
  isEdit,
  params,
  values,
  reloadCallback,
  file = null,
  path = ''
) {
  yield put({
    type: 'DATA_FILES_SET_OPERATION_STATUS',
    payload: { status: 'RUNNING', operation: 'dynamicform' },
  });

  // filter out empty values from the metadata
  const filteredValues = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => value !== '' && value !== null
    )
  );

  try {
    if (file && isEdit) {
      yield call(
        patchEntityUtil,
        filteredValues.data_type,
        params.system,
        file.path ? '/' + file.path : '',
        '/' + path,
        filteredValues,
        file.uuid
      );
    } else {
      yield call(
        createEntityUtil,
        filteredValues.data_type,
        params.system,
        path || '/',
        filteredValues
      );
    }

    if (reloadCallback) {
      const newPath =
        isEdit && file.path === params.path
          ? `${path}/${file.path.split('/').pop()}`
          : path;
   
      // Check if the file name has changed. If not, keep the same path.
      const reloadPath =
        isEdit && file.name !== values.name
          ? newPath.replace(`/${file.name}`, `/${values.name}`)
          : newPath;
   
      yield call(reloadCallback, reloadPath);
    }

    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'SUCCESS', operation: 'dynamicform' },
    });

    yield put({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'dynamicform',
        props: {},
      },
    });

    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: {}, operation: 'dynamicform' },
    });
  } catch (e) {
    yield put({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'ERROR', operation: 'dynamicform' },
    });
  }
}

function* handleSampleData(action, isEdit) {
  const {
    params,
    values,
    reloadPage: reloadCallback,
    selectedFile,
  } = action.payload;

  const metadata = {
    ...values,
    data_type: 'sample',
  };

  yield call(
    executeOperation,
    isEdit,
    params,
    metadata,
    reloadCallback,
    selectedFile
  );
}

function* handleOriginData(action, isEdit) {
  const {
    params,
    values,
    reloadPage: reloadCallback,
    selectedFile,
    additionalData: { samples },
  } = action.payload;

  const sample = samples.find((sample) => sample.uuid === values.sample);

  const metadata = {
    ...values,
    data_type: 'digital_dataset',
    sample: sample.uuid,
  };

  const path = sample.value.name;

  yield call(
    executeOperation,
    isEdit,
    params,
    metadata,
    reloadCallback,
    selectedFile,
    path
  );
}

function* handleAnalysisData(action, isEdit) {
  const {
    params,
    values,
    reloadPage: reloadCallback,
    selectedFile,
    additionalData: { samples, originDatasets },
  } = action.payload;

  const sample = samples.find((sample) => sample.uuid === values.sample);

  const originData = originDatasets.find(
    (originData) => originData.uuid === values.base_origin_data
  );

  let path = originData
    ? `${sample.value.name}/${originData.value.name}`
    : sample.value.name;

  const metadata = {
    ...values,
    data_type: 'analysis_data',
    sample: sample.uuid,
  };

  yield call(
    executeOperation,
    isEdit,
    params,
    metadata,
    reloadCallback,
    selectedFile,
    path
  );
}

function* handleFile(action, isEdit) {
  const {
    params,
    values,
    reloadPage: reloadCallback,
    selectedFile,
  } = action.payload;

  const metadata = {
    ...values,
    data_type: 'file',
  };

  const path = selectedFile.path.split('/').slice(0, -1).join('/');

  yield call(
    executeOperation,
    isEdit,
    params,
    metadata,
    reloadCallback,
    selectedFile,
    path
  );
}

export default function* watchDRP() {
  yield takeLatest('ADD_SAMPLE_DATA', (action) =>
    handleSampleData(action, false)
  );
  yield takeLatest('EDIT_SAMPLE_DATA', (action) =>
    handleSampleData(action, true)
  );
  yield takeLatest('ADD_ANALYSIS_DATASET', (action) =>
    handleAnalysisData(action, false)
  );
  yield takeLatest('EDIT_ANALYSIS_DATASET', (action) =>
    handleAnalysisData(action, true)
  );
  yield takeLatest('ADD_ORIGIN_DATASET', (action) =>
    handleOriginData(action, false)
  );
  yield takeLatest('EDIT_ORIGIN_DATASET', (action) =>
    handleOriginData(action, true)
  );
  yield takeLatest('EDIT_FILE', (action) => handleFile(action, true));
}
