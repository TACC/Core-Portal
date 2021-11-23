import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';

function useMove() {
  const dispatch = useDispatch();

  const { selectedFiles: selected } = useSelectedFiles();

  const status = useSelector(
    state => state.files.operationStatus.move,
    shallowEqual
  );

  const setStatus = newStatus =>
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'move', status: newStatus }
    });

  const move = ({ destSystem, destPath, callback }) => {
    const filteredSelected = selected.filter(f => status[f.id] !== 'SUCCESS');
    dispatch({
      type: 'DATA_FILES_MOVE',
      payload: {
        dest: { system: destSystem, path: destPath },
        src: filteredSelected,
        reloadCallback: callback
      }
    });
  };

  return { move, status, setStatus };
}

export default useMove;
