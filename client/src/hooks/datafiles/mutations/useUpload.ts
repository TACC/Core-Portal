import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from 'utils/apiClient';
import Cookies from 'js-cookie';
import truncateMiddle from 'utils/truncateMiddle';
import { useMutation } from '@tanstack/react-query';
import { TTapisToken } from '../useTapisToken';

export async function uploadUtil({
  api,
  scheme,
  system,
  path,
  file,
  tapisToken,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  file: FormData;
  tapisToken: TTapisToken;
}): Promise<{ file: any; path: string }> {
  let apiPath = !path || path[0] === '/' ? path : `/${path}`;
  if (apiPath === '/') {
    apiPath = '';
  }
  const formData = new FormData();
  const fileField = file.get('uploaded_file') as File;
  let url: string = '';
  let config: AxiosRequestConfig = {};

  if (api === 'tapis') {
    formData.append('file', fileField);
    url = `${tapisToken.baseUrl}/v3/files/ops/${system}/${apiPath}/${fileField.name}`;
    config = {
      headers: {
        'content-type': 'multipart/form-data',
        'X-Tapis-Token': tapisToken.token,
        'X-Tapis-Tracking-ID': tapisToken.tapisTrackingId,
      },
    };
  } else {
    formData.append('uploaded_file', fileField);
    url = `/api/datafiles/${api}/upload/${scheme}/${system}/${apiPath}/`;
    config = {
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken') || '',
      },
      withCredentials: true,
    };
    url = url.replace(/\/{2,}/g, '/');
  }
  const response = await apiClient.post(url, formData, config);
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
    tapisToken,
  }: {
    system: string;
    path: string;
    files: { data: File; id: string }[];
    reloadCallback: () => void;
    tapisToken: TTapisToken;
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
          tapisToken,
        },
        {
          onSuccess: () => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: { status: 'SUCCESS', key: index, operation: 'upload' },
            });
          },
          onError: (error) => {
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
