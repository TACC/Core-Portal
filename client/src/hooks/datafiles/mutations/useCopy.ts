import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useSelectedFiles } from 'hooks/datafiles';
import Cookies from 'js-cookie';
import { apiClient } from 'utils/apiClient';
import { useMutation } from '@tanstack/react-query';
import truncateMiddle from 'utils/truncateMiddle';

export async function copyFileUtil({
  api,
  scheme,
  system,
  path,
  filename,
  filetype,
  destApi,
  destSystem,
  destPath,
  destPathName,
}: {
  api: string;
  scheme: string;
  system: string;
  path: string;
  filename: string;
  filetype: string;
  destApi: string;
  destSystem: string;
  destPath: string;
  destPathName: string;
}) {
  let url: string, body: any;
  if (api === destApi) {
    url = `/api/datafiles/${api}/copy/${scheme}/${system}/${path}/`;
    url = url.replace(/\/{2,}/g, '/');
    body = {
      dest_system: destSystem,
      dest_path: destPath,
      file_name: filename,
      filetype,
      dest_path_name: destPathName,
    };
  } else {
    url = `/api/datafiles/transfer/${filetype}/`;
    url = url.replace(/\/{2,}/g, '/');
    body = {
      src_api: api,
      dest_api: destApi,
      src_system: system,
      dest_system: destSystem,
      src_path: path,
      dest_path: destPath,
      dest_path_name: destPathName,
      dirname: filename,
    };
  }

  const response = await apiClient.put(url, body, {
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
    withCredentials: true,
  });
  return response.data;
}

function useCopy() {
  const dispatch = useDispatch();

  const { selectedFiles: selected } = useSelectedFiles();

  const status = useSelector(
    (state: any) => state.files.operationStatus.copy,
    shallowEqual
  );

  const { scheme } = useSelector(
    (state: any) => state.files.params.FilesListing
  );
  const setStatus = (newStatus: string) =>
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'copy', status: newStatus },
    });

  const { mutate } = useMutation({ mutationFn: copyFileUtil });
  const copy = ({
    srcApi,
    destApi,
    destSystem,
    destPath,
    name,
    callback,
  }: {
    srcApi: string;
    destApi: string;
    destSystem: string;
    destPath: string;
    name: string;
    callback: any;
  }) => {
    const filteredSelected = selected
      .filter((f: any) => status[f.id] !== 'SUCCESS')
      .map((f: any) => ({ ...f, api: srcApi }));
    const copyCalls = filteredSelected.map((file: any) => {
      // Copy File
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
        payload: { status: 'RUNNING', key: file.id, operation: 'copy' },
      });

      mutate(
        {
          api: file.api,
          scheme: scheme,
          system: file.system,
          path: file.path,
          filename: file.name,
          filetype: file.type,
          destApi,
          destSystem,
          destPath,
          destPathName: name,
        },
        {
          onSuccess: () => {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: { status: 'SUCCESS', key: file.id, operation: 'copy' },
            });
            dispatch({
              type: 'DATA_FILES_TOGGLE_MODAL',
              payload: { operation: 'copy', props: {} },
            });
          },
          onError: (error) => {
            console.log('The error is ', error);
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
              payload: { status: 'ERROR', key: file.id, operation: 'copy' },
            });
          },
        }
      );
    });
    // Result
    const result = copyCalls;
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `${
          copyCalls.length > 1 ? `${copyCalls.length} files` : 'File'
        } copied to ${truncateMiddle(`${destPath}`, 20) || '/'}`,
      },
    });
    callback();
  };
  return { copy, status, setStatus };
}

export default useCopy;
