import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useSelectedFiles } from 'hooks/datafiles';
import Cookies from 'js-cookie';
import { apiClient } from 'utils/apiClient';

export async function trashUtil({
  api,
  scheme,
  system,
  path,
  homeDir,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  homeDir: string;
}): Promise<{ name: string; path: string }> {
  const url = `/api/datafiles/${api}/trash/${scheme}/${system}/${path}/`;
  const request = await apiClient.put(url, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken') || '',
    },
    withCredentials: true,
    body: JSON.stringify({
      homeDir: homeDir,
    }),
  });

  return request.data;
}

function useTrash() {
  const dispatch = useDispatch();
  const { selectedFiles: selected } = useSelectedFiles();
  const status = useSelector(
    (state: any) => state.files.operationStatus.trash,
    shallowEqual
  );

  const { api, scheme } = useSelector(
    (state: any) => state.files.params.FilesListing
  );
  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'trash' },
    });
  };

  const { mutateAsync } = useMutation({ mutationFn: trashUtil });

  const trash = ({
    selection,
    callback,
  }: {
    selection: any;
    callback: (name: string, path: string) => any;
  }) => {
    const filteredSelected = selected.filter(
      (f: any) => status[f.id] !== 'SUCCESS'
    );
    const trashCalls: Promise<any>[] = filteredSelected.forEach((file: any) => {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
        payload: {
          status: 'RUNNING',
          key: (index: string) => index,
          operation: 'trash',
        },
      });
      return mutateAsync(
        {
          api: api,
          scheme: scheme,
          system: selection.system,
          path: selection.path,
          homeDir: selection.homeDir,
        },
        {
          onSuccess: (response: any) => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: {
                status: 'SUCCESS',
                key: (index: string) => index,
                operation: 'trash',
              },
            });
            dispatch({
              type: 'ADD_TOAST',
              payload: {
                message: `${selection} moved to Trash`,
              },
            });
            callback(response.name, response.path);
          },
          onError: () => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: {
                status: 'ERROR',
                key: (index: string) => index,
                operation: 'trash',
              },
            });
          },
        }
      );
    });
    // filteredSelected.forEach(() => {
    // });
  };

  return { trash, status, setStatus };
}

export default useTrash;
