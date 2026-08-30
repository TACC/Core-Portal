import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import truncateMiddle from 'utils/truncateMiddle';
import { apiClient } from 'utils/apiClient';

export async function renameFileUtil({
  api,
  scheme,
  system,
  path,
  newName,
  metadata,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  newName: string;
  metadata?: Record<string, any>;
}): Promise<{ name: string; path: string }> {
  const url = `/api/datafiles/${api}/rename/${scheme}/${system}/${path}/`;

  const response = await apiClient.put<{ name: string; path: string }>(url, {
    new_name: newName,
    metadata: metadata ?? null,
  });

  return response.data;
}

function useRename() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state: any) => state.files.operationStatus.rename,
    shallowEqual
  );
  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'rename' },
    });
  };

  const { mutate } = useMutation({ mutationFn: renameFileUtil });

  const rename = ({
    selectedFile,
    newName,
    api,
    scheme,
    callback,
  }: {
    selectedFile: any;
    newName: string;
    api: string;
    scheme: string;
    callback: (name: string, path: string) => any;
  }) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'RUNNING', operation: 'rename' },
    });

    mutate(
      {
        api,
        scheme,
        system: selectedFile.system,
        path: '/' + selectedFile.path,
        newName,
        metadata: selectedFile.metadata ? {...selectedFile.metadata, name: newName} : null,
      },
      {
        onSuccess: (resp) => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'SUCCESS', operation: 'rename' },
          });
          callback(resp.name, resp.path);
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              message: `${selectedFile.name} renamed to ${truncateMiddle(
                newName,
                20
              )}`,
            },
          });
        },
        onError: () => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'ERROR', operation: 'rename' },
          });
        },
      }
    );
  };

  return { rename, status, setStatus };
}

export default useRename;
