import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';

function useCopy() {
  const dispatch = useDispatch();

  const { selectedFiles: selected } = useSelectedFiles();

  const status = useSelector(
    (state: any) => state.files.operationStatus.copy,
    shallowEqual
  );

  const setStatus = (newStatus: string) =>
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'copy', status: newStatus },
    });

  const copy = ({
    srcApi,
    destApi,
    destSystem,
    destPath,
    name,
    callback,
  }: {
    srcApi: string;
    destApi: string;
    destSystem: string;
    destPath: string;
    name: string;
    callback: any;
  }) => {
    const filteredSelected = selected
      .filter((f: any) => status[f.id] !== 'SUCCESS')
      .map((f: any) => ({ ...f, api: srcApi }));
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
