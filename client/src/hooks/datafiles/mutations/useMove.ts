import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';
import truncateMiddle from 'utils/truncateMiddle';

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
  const setStatus = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'move', status: 'RUNNING' },
    });
  };

  const { mutate, isIdle, isSuccess, failureCount } = useMutation({ mutationFn: moveFileUtil });

  const move = ({
    destSystem,
    destPath,
    callback,
  }: {
    destSystem: string;
    destPath: string;
    callback: () => void;
  }) => {
    const filteredSelected = selected.filter(
      (f: any) => status[f.id] !== 'SUCCESS'
    );
    filteredSelected.forEach((file: any) => {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
        payload: {
          status: 'RUNNING',
          key: file.id,
          operation: 'move',
        },
      });
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
          onSuccess: () => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: {
                status: 'SUCCESS',
                key: (index: string) => index,
                operation: 'move',
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
    if (!isIdle && isSuccess && failureCount === 0) {
      callback();
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          message: `${
            filteredSelected.length > 1 ? `${filteredSelected.length} files` : 'File'
          } moved to ${truncateMiddle(destPath, 20) || '/'}`,
        },
      });
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { operation: 'move', status: {} },
      });
    } else {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { operation: 'move', status: 'FAILURE' },
      });
    };
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'move', props: {} },
    });
  };

  return { move, status, setStatus };
}

export default useMove;
