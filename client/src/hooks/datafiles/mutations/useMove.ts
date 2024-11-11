import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';

export async function moveFileUtil({
  api,
  scheme,
  system,
  path,
  destSystem,
  destPath,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  destSystem: string;
  destPath: string;
}): Promise<{ name: string; path: string }> {
  const body = {
    dest_system: destSystem,
    dest_path: destPath,
  };
  const url = `/api/datafiles/${api}/move/${scheme}/${system}/${path}/`;
  const request = await apiClient.put(url, body);
  return request.data;
}

function useMove() {
  const dispatch = useDispatch();
  const { selectedFiles: selected } = useSelectedFiles();
  const status = useSelector(
    (state: any) => state.files.operationStatus.move,
    shallowEqual
  );

  const { api, scheme } = useSelector(
    (state: any) => state.files.params.FilesListing
  );
  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'move', status: newStatus },
    });
  };

  const { mutate } = useMutation({ mutationFn: moveFileUtil });

  const move = ({
    destSystem,
    destPath,
    callback,
  }: {
    destSystem: string;
    destPath: string;
    callback: (name: string, path: string) => any;
  }) => {
    const filteredSelected = selected.filter(
      (f: any) => status[f.id] !== 'SUCCESS'
    );
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: {
        status: 'RUNNING',
        key: (index: string) => index,
        operation: 'move',
      },
    });

    filteredSelected.forEach((file: any) => {
      mutate(
        {
          api: api,
          scheme: scheme,
          system: file.system,
          path: file.path,
          destSystem: destSystem,
          destPath: destPath,
        },
        {
          onSuccess: (response: any) => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: {
                status: 'SUCCESS',
                key: (index: string) => index,
                operation: 'move',
              },
            });
            callback(response.name, response.path);
            dispatch({
              type: 'ADD_TOAST',
              payload: {
                message: `File moved to ${destPath}`,
              },
            });
          },
          onError: () => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: {
                status: 'ERROR',
                key: (index: string) => index,
                operation: 'move',
              },
            });
          },
        }
      );
    });
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'move', status: {} },
    });
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'move', props: {} },
    });
  };

  return { move, status, setStatus };
}

export default useMove;
