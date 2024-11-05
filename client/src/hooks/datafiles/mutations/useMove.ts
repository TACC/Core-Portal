import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';
import Cookies from 'js-cookie';

export async function moveFileUtil({
  // Establish variables and their types per TypeScript
  api,
  scheme,
  system,
  path,
  destSystem,
  destPath
}: {
  api: string,
  scheme: string,
  system: string,
  path: string,
  destSystem: string,
  destPath: string
}): Promise<{ name: string; path: string }>  {
  const url = `/api/datafiles/${api}/move/${scheme}/${system}/${path}/`;
  const request = await apiClient.put<{ name: string; path: string }>(url, {
    method: 'PUT',
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    credentials: 'same-origin',
    body: JSON.stringify({ dest_system: destSystem, dest_path: destPath })
  });
  return request.data;
}

function useMove() {
  const dispatch = useDispatch();
  const { selectedFiles: selected } = useSelectedFiles();
  const status = useSelector(
    (state: any) => state.files.operationStatus.move,
    shallowEqual
  );

  const setStatus = (newStatus: any) =>
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'move', status: newStatus },
    });

  // Establish mutate using moveFileUtil as its mutation function  
  const { mutate } = useMutation({ mutationFn: moveFileUtil });

  const move = ({ 
    // Establish variables and their types per TypeScript
    destSystem, 
    destPath, 
    callback 
  }: {
    destSystem: any;
    destPath: any;
    callback: (name: string, path: string) => any;
  }) => {
    const filteredSelected = selected.filter((f: any) => status[f.id] !== 'SUCCESS');
    dispatch({
      type: 'DATA_FILES_MOVE',
      payload: {
        dest: { system: destSystem, path: destPath },
        src: filteredSelected,
        reloadCallback: callback,
      },
    });

    // Establish the parameters of mutate
    mutate(
      {
        api: filteredSelected.api,
        scheme: filteredSelected.scheme,
        system: filteredSelected.system,
        path: filteredSelected.path,
        destSystem,
        destPath,
      },
      {
        // Moves the file to a new location if successful
        onSuccess: (response: any) => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'SUCCESS', operation: 'move' },
          });
          callback(response.name, response.path);
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              message: `File moved to ${destPath}`,
            },
          });
        },
        // Sends an error message if it's not successful
        onError: () => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'ERROR', operation: 'move' },
          });
        },
      }
    );
  };

  return { move, status, setStatus };
}

export default useMove;
