import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';

function useCopy() {

  const dispatch = useDispatch();

  const { selectedFiles: selected }= useSelectedFiles();

  const status = useSelector(
    state => state.files.operationStatus.copy,
    shallowEqual
  );

  const setStatus = newStatus =>
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'copy', status: newStatus },
    });

  const copy = ({ srcApi, destApi, destSystem, destPath, name, callback }) => {
    const filteredSelected = selected
      .filter(f => status[f.id] !== 'SUCCESS')
      .map(f => ({ ...f, api: srcApi }));
    dispatch({
      type: 'DATA_FILES_COPY',
      payload: {
        dest: { system: destSystem, path: destPath, api: destApi, name },
        src: filteredSelected,
        reloadCallback: callback,
      },
    });
  };

  return { copy, status, setStatus };
}

export default useCopy;
