import { useSelector, useDispatch, shallowEqual } from 'react-redux';

function useTrash() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state) => state.files.operationStatus.trash,
    shallowEqual
  );

  const setStatus = (newStatus) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'trash' },
    });
  };

  const trash = ({ selection, callback }) =>
    dispatch({
      type: 'DATA_FILES_TRASH',
      payload: {
        src: selection,
        reloadCallback: callback,
      },
    });

  return { trash, status, setStatus };
}

export default useTrash;
