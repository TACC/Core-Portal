import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';
import Cookies from 'js-cookie';

export async function trashUtil({
  // Per TypeScript, declare variables...
  api, 
  scheme, 
  system, 
  path, 
  homeDir
}: {
  // ...and their types for use in this function
  api: string;
  scheme: string;
  system: string;
  path: string;
  homeDir: string;
}): Promise<{ name: string; path: string }> {
  const url = `/api/datafiles/${api}/trash/${scheme}/${system}/${path}/`;
  const request = await apiClient.put<{ name: string; path: string }>(url, {
    method: 'PUT',
    headers: { 
      'X-CSRFToken': Cookies.get('csrftoken') 
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      homeDir: homeDir,
    }),
  });

  return request.data;
}

function useTrash() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state: any) => state.files.operationStatus.trash,
    shallowEqual
  );

  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'trash' },
    });
  };
  // Establish mutate using trashUtil as its mutation function
  const { mutate } = useMutation({ mutationFn: trashUtil });

  const trash = ({ 
    // Per TypeScript, declare variables...
    selection, 
    callback 
  }: {
    // ...and their types for use in this function
    selection: any;
    callback: (name: string, path: string) => any;
  }) => {
    dispatch({
      type: 'DATA_FILES_TRASH',
      payload: {
        src: selection,
        reloadCallback: callback,
      },
    });

    // Establish the parameters of mutate
    mutate(
      {
        api: selection.api, 
        scheme: selection.scheme, 
        system: selection.system,
        path: '/' + selection.path,
        homeDir: selection.homeDir
      },
      {
        // Sends the file to the Trash if successful
        onSuccess: (response) => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'SUCCESS', operation: 'trash' },
          });
          callback(response.name, response.path);
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              message: `${selection} moved to Trash`
            },
          });
        },
        // Sends an error message if it's not successful
        onError: () => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'ERROR', operation: 'trash' },
          });
        }
      }
    );
  };
  
  return { trash, status, setStatus };
};

export default useTrash;
