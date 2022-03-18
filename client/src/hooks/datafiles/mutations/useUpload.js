import { useSelector, useDispatch, shallowEqual } from 'react-redux';

function useUpload() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state) => state.files.operationStatus.upload,
    shallowEqual
  );

  const setStatus = (newStatus) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'upload' },
    });
  };

  const upload = ({ system, path, files, reloadCallback }) => {
    dispatch({
      type: 'DATA_FILES_UPLOAD',
      payload: {
        system,
        path,
        files,
        reloadCallback,
      },
    });
  };

  return { upload, status, setStatus };
}

export default useUpload;
