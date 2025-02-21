import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { apiClient } from 'utils/apiClient';
import Cookies from 'js-cookie';
import truncateMiddle from 'utils/truncateMiddle';
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
}): Promise<{ file: any; path: string }> {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
    return { file, path: apiPath };
  }
  const formData = new FormData();
  const fileField = file.get('uploaded_file') as Blob;
  formData.append('uploaded_file', fileField);
  let url = `/api/datafiles/${api}/upload/${scheme}/${system}/${apiPath}/`;
  url = url.replace(/\/{2,}/g, '/');
  const response = await apiClient.post(url, formData, {
    headers: {
      'X-CSRFToken': Cookies.get('csrftoken') || '',
    },
    withCredentials: true,
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

  const { mutateAsync } = useMutation({ mutationFn: uploadUtil });

  const upload = ({
    system,
    path,
    files,
    reloadCallback,
  }: {
    system: string;
    path: string;
    files: { data: File; id: string }[];
    reloadCallback: () => void;
  }) => {
    const api = 'tapis';
    const scheme = 'private';
    const uploadCalls: Promise<any>[] = files.map((fileObj) => {
      const { data: file, id: index } = fileObj;
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
        payload: { status: 'UPLOADING', key: index, operation: 'upload' },
      });
      const formData = new FormData();
      formData.append('uploaded_file', file);
      return mutateAsync(
        {
          api,
          scheme,
          system,
          path,
          file: formData,
        },
        {
          onSuccess: () => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: { status: 'SUCCESS', key: index, operation: 'upload' },
            });
          },
          onError: (error) => {
            console.log('The Error is', error);
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: { status: 'ERROR', key: index, operation: 'upload' },
            });
          },
        }
      );
    });
    Promise.all(uploadCalls).then(() => {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'upload', props: {} },
      });
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          message: `${
            files.length > 1 ? `${files.length} files` : 'File'
          } uploaded to ${truncateMiddle(path, 20) || '/'}`,
        },
      });
      reloadCallback();
    });
  };
  return { upload, status, setStatus };
}
export default useUpload;
