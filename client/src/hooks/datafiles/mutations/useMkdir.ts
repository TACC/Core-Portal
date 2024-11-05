import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';

export async function mkdirUtil({
  api,
  scheme,
  system,
  path,
  dirname,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  dirname: string;
}): Promise<{ name: string; path: string }> {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
  }
  let url = `/api/datafiles/${api}/mkdir/${scheme}/${system}/${apiPath}/`;
  url.replace(/\/{2,}/g, '/');
  const response = await apiClient.put<{ name: string; path: string }>(url, {
    dirname: dirname,
  });

  return response.data;
}

function useMkdir() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state: any) => state.files.operationStatus.mkdir,
    shallowEqual
  );

  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'mkdir' },
    });
  };

  // TODO: Converted to mutation
  const { mutate } = useMutation({ mutationFn: mkdirUtil });

  const mkdir = ({
    api,
    scheme,
    system,
    path,
    dirname,
    reloadCallback,
  }: {
    api: string;
    scheme: string;
    system: string;
    path: string;
    dirname: string;
    reloadCallback: any;
  }) => {
    dispatch({
      type: 'DATA_FILES_MKDIR',
      payload: {
        api,
        scheme,
        system,
        path,
        dirname,
        reloadCallback,
      },
    });
    mutate(
      {
        api,
        scheme,
        system,
        path,
        dirname,
      },
      {
        onSuccess: () => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: { status: 'SUCCESS', operation: 'rename' },
          });
          dispatch({
            type: 'DATA_FILES_TOGGLE_MODAL',
            payload: {
              operation: 'mkdir',
              props: {},
            },
          });
          reloadCallback;
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

  return { mkdir, status, setStatus };
}

export default useMkdir;
