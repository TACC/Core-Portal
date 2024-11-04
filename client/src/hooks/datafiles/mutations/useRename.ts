import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import truncateMiddle from 'utils/truncateMiddle';

export async function renameFileUtil({
  api,
  scheme,
  system,
  path,
  newName,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  newName: string;
}): Promise<{ name: string; path: string }> {
  const url = `/api/datafiles/${api}/rename/${scheme}/${system}/${path}/`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') ?? '' },
    credentials: 'same-origin',
    body: JSON.stringify({ new_name: newName }),
  });
  if (!response.ok) {
    throw new Error(response.status.toString());
  }

  const responseJson = await response.json();
  return responseJson.data;
}

function useRenameMutation() {
  return useMutation({ mutationFn: renameFileUtil });
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

  const { mutate } = useRenameMutation();

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
