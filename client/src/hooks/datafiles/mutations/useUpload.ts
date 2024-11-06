import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { apiClient } from 'utils/apiClient';
import { useMutation } from '@tanstack/react-query';
export async function uploadUtil({
  api,
  scheme,
  system,
  path,
  file,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  file: FormData;
}): Promise<{ file: FormData; path: string }> {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
    return { file, path: apiPath };
  }
  const formData = new FormData();
  const fileField = file.get('uploaded_file') as Blob;
  formData.append('uploaded_file', fileField);
  let url = `/api/datafiles/${api}/upload/${scheme}/${system}/${apiPath}/`;
  url.replace(/\/{2,}/g, '/');
  const response = await apiClient.put<{ file: FormData; path: string }>(url, {
    body: formData,
  });
  return response.data;
}

function useUpload() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state: any) => state.files.operationStatus.upload,
    shallowEqual
  );

  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'upload' },
    });
  };

  const { mutate } = useMutation({ mutationFn: uploadUtil });

  const upload = ({
    api,
    scheme,
    system,
    path,
    file,
    index,
  }: {
    api: string;
    scheme: string;
    system: string;
    path: string;
    file: FormData;
    index: string;
  }) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
      payload: { status: 'UPLOADING', key: index, operation: 'upload' },
    });
    mutate(
      {
        api,
        scheme,
        system,
        path,
        file,
      },
      {
        onSuccess: (resp) => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
            payload: { status: 'SUCCESS', key: index, operation: 'upload' },
          });
        },
        onError: () => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
            payload: { status: 'ERROR', key: index, operation: 'upload' },
          });
        },
      }
    );
  };

  return { upload, status, setStatus };
}

export default useUpload;
