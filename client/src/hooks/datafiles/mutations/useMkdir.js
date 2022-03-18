import { useSelector, useDispatch, shallowEqual } from 'react-redux';

function useMkdir() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state) => state.files.operationStatus.mkdir,
    shallowEqual
  );

  const setStatus = (newStatus) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'mkdir' },
    });
  };

  const mkdir = ({ api, scheme, system, path, dirname, reloadCallback }) => {
    dispatch({
        type: 'DATA_FILES_MKDIR',
        payload: {
          api,
          scheme,
          system,
          path,
          dirname,
          reloadCallback
        },
      });
  };

  return { mkdir, status, setStatus };
}

export default useMkdir;
