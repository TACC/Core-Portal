import { useSelector, useDispatch, shallowEqual } from 'react-redux';

function useCompress() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state) => state.files.operationStatus.compress,
    shallowEqual
  );

  const setStatus = (newStatus) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'compress' },
    });
  };

  const compress = ({ filename, files, onSuccess }) => {
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload: { filename, files, onSuccess },
    });
  };

  return { compress, status, setStatus };
}

export default useCompress;
