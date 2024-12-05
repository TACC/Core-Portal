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
}) {
  const url = `/api/datafiles/${api}/trash/${scheme}/${system}/${path}/`;
  const body = {
    homeDir: homeDir
  };
  const response = await apiClient.put(url, body, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken' || ''),
    },
    withCredentials: true,
  });
  // const request = await fetch(url, {
  //   method: 'PUT',
  //   headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
  //   credentials: 'same-origin',
  //   body: JSON.stringify({
  //     homeDir: homeDir,
  //   }),
  // });
  // const request = await apiClient.put(url, body);

  return response.data;
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
    destSystem,
    homeDir,
    callback,
  }: {
    destSystem: string;
    homeDir: any;
    callback: any;
  }) => {
    const filteredSelected = selected.filter(
      (f: any) => status[f.id] !== 'SUCCESS'
    );
    const trashCalls: Promise<any>[] = filteredSelected.map((file: any) => {
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
          system: destSystem,
          path: file.path,
          homeDir: homeDir,
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
            
            callback();
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
    Promise.all(trashCalls).then(() => {
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          message: `${
            filteredSelected.length > 1 
              ? `${filteredSelected.length} files moved to Trash` 
              : 'File moved to Trash'
          }`,
        },
      });
    });
  };

  return { trash, status, setStatus };
}

export default useTrash;
