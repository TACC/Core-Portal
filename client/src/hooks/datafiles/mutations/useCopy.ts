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
  metadata,
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
  metadata?: Record<string, any>;
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
      metadata: metadata ?? null,
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
    headers: { 'X-CSRFToken': Cookies.get('csrfcookie') || '' },
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

  const { mutateAsync } = useMutation({ mutationFn: copyFileUtil });
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
      .filter((f: any) => !['SUCCESS', 'ACCEPTED'].includes(status[f.id]))
      .map((f: any) => ({ ...f, api: srcApi }));
    const copyCalls: Promise<any>[] = filteredSelected.map((file: any) => {
      // Copy File
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
        payload: { status: 'RUNNING', key: file.id, operation: 'copy' },
      });
      return mutateAsync({
        api: file.api,
        scheme,
        system: file.system,
        path: file.path,
        filename: file.name,
        filetype: file.type,
        destApi,
        destSystem,
        destPath,
        destPathName: name,
        metadata: file.metadata,
      }).then(
        (response) => {
          const pending = response.data?.pending === true;
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
            payload: {
              status: pending ? 'ACCEPTED' : 'SUCCESS',
              key: file.id,
              operation: 'copy',
            },
          });
          return { pending };
        },
        (error) => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY',
            payload: { status: 'ERROR', key: file.id, operation: 'copy' },
          });
          throw error;
        }
      );
    });
    return Promise.allSettled(copyCalls).then((results) => {
      const completed = results.filter(
        (r) => r.status === 'fulfilled' && !r.value.pending
      ).length;
      const pending = results.filter(
        (r) => r.status === 'fulfilled' && r.value.pending
      ).length;
      if (results.every((r) => r.status === 'fulfilled')) {
        dispatch({
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: { operation: 'copy', props: {} },
        });
      }
      if (pending) {
        const fileLabel = pending === 1 ? 'file' : 'files';
        dispatch({
          type: 'ADD_TOAST',
          payload: {
            status: 'INFO',
            message: `Copy started for ${pending} ${fileLabel}. You will be notified when complete.`,
          },
        });
      }
      if (completed) {
        const fileLabel = completed === 1 ? 'File' : 'Files';
        dispatch({
          type: 'ADD_TOAST',
          payload: {
            message: `${fileLabel} copied to ${
              truncateMiddle(destPath, 20) || '/'
            }`,
          },
        });
        callback();
      }
    });
  };
  return { copy, status, setStatus };
}

export default useCopy;
