import { useSelector, useDispatch, shallowEqual } from 'react-redux';

function useRename() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state) => state.files.operationStatus.rename,
    shallowEqual
  );
  const setStatus = (newStatus) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'rename' },
    });
  };

  const rename = ({ selectedFile, newName, api, scheme, callback }) => {
    dispatch({
      type: 'DATA_FILES_RENAME',
      payload: {
        selectedFile,
        newName,
        reloadCallback: callback,
        api,
        scheme,
      },
    });
  };

  return { rename, status, setStatus };
}

export default useRename;
