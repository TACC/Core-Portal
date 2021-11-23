import { useSelector, useDispatch, shallowEqual } from 'react-redux';

function useExtract() {
  const dispatch = useDispatch();
  const status = useSelector(
    state => state.files.operationStatus.extract,
    shallowEqual
  );

  const setStatus = (status) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status, operation: 'extract' }
    });
  }

  const extract = ({ file }) => {
    dispatch({
        type: 'DATA_FILES_EXTRACT',
        payload: { file }
      });
  };

  return { extract, status, setStatus }
}

export default useExtract;
