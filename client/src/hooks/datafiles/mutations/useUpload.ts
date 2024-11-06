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
  const request = await fetch(url, {
    method: 'POST',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
    credentials: 'same-origin',
    body: formData,
  });
  if (!request.ok) {
    throw new Error(request.status.toString());
  }
  return { file, path: apiPath };
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

    files.forEach((fileObj) => {
      const { data: file, id: index } = fileObj;
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
        payload: { status: 'UPLOADING', key: index, operation: 'upload' },
      });

      const formData = new FormData();
      formData.append('uploaded_file', file);

      mutate(
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
            dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
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

    dispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          files.length > 1 ? `${files.length} files` : 'File'
        } uploaded to ${truncateMiddle(path, 20) || '/'}`,
      },
    });

    reloadCallback();
  };
  return { upload, status, setStatus };
}
export default useUpload;
