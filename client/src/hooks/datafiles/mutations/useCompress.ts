import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getCompressParams } from 'utils/getCompressParams';
import { apiClient } from 'utils/apiClient';
import { TTapisFile, TPortalSystem } from 'utils/types';
import { TJobBody, TJobPostResponse } from './useSubmitJob';
import { getAppUtil, getDefaultAllocation } from './toolbarAppUtils';

async function submitJobUtil(body: TJobBody) {
  const res = await apiClient.post<TJobPostResponse>(
    `/api/workspace/jobs`,
    body
  );
  return res.data.response;
}

function useCompress() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state: any) => state.files.operationStatus.compress,
    shallowEqual
  );

  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'compress' },
    });
  };

  const compressErrorAction = (errorMessage: any) => {
    return {
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: {
        status: { type: 'ERROR', message: errorMessage },
        operation: 'compress',
      },
    };
  };

  const compressApp = useSelector(
    (state: any) => state.workbench.config.compressApp
  );
  const { data: fullCompressApp } = useQuery({
    queryKey: ['compress-app', compressApp.id, compressApp.version],
    queryFn: () => getAppUtil(compressApp.id, compressApp.version),
  });

  const defaultAllocation = useSelector((state: any) => {
    return getDefaultAllocation(state.allocations, fullCompressApp)
  });

  const systems = useSelector(
    (state: any) => state.systems.storage.configuration
  );

  const { mutateAsync } = useMutation({ mutationFn: submitJobUtil });

  const compress = ({
    scheme,
    files,
    filename,
    compressionType,
    fromDownload = false,
  }: {
    scheme: string;
    files: TTapisFile[];
    filename: string;
    compressionType: string;
    fromDownload?: boolean;
  }) => {
    setStatus({ type: 'RUNNING' });

    let defaultPrivateSystem: TPortalSystem | undefined;

    if (files[0].scheme === 'private' && files[0].api === 'tapis') {
      defaultPrivateSystem = undefined;
    }

    if (!defaultAllocation) {
      throw new Error('You need an allocation to compress.', {
        cause: 'compressError',
      });
    }

    if (scheme !== 'private' && scheme !== 'projects') {
      defaultPrivateSystem = systems.find((s: any) => s.default);

      if (!defaultPrivateSystem) {
        throw new Error('Folder downloads are unavailable in this portal', {
          cause: 'compressError',
        });
      }
    }

    const params = getCompressParams(
      files,
      filename,
      compressionType,
      compressApp,
      defaultAllocation,
      defaultPrivateSystem
    );

    return mutateAsync(
      {
        job: params,
      },
      {
        onSuccess: (response: any) => {
          // If the execution system requires pushing keys, then
          // bring up the modal and retry the compress action
          if (response.execSys) {
            dispatch({
              type: 'SYSTEMS_TOGGLE_MODAL',
              payload: {
                operation: 'pushKeys',
                props: {
                  system: response.execSys,
                  onCancel: compressErrorAction('An error has occurred'),
                },
              },
            });
          } else if (response.status === 'PENDING') {
            setStatus({ type: 'SUCCESS' });
            dispatch({
              type: 'ADD_TOAST',
              payload: {
                message: 'Compress job submitted.',
              },
            });
            setStatus({});  // clear compress status after successful submission
            if (!fromDownload) {
              dispatch({
                type: 'DATA_FILES_TOGGLE_MODAL',
                payload: { operation: 'compress', props: {} },
              });
            } else {
              dispatch({
                type: 'DATA_FILES_TOGGLE_MODAL',
                payload: { operation: 'downloadMessage', props: {} },
              });
            }
          }
        },
        onError: (response) => {
          const errorMessage =
            response.cause === 'compressError'
              ? response.message
              : 'An error has occurred.';
          setStatus({ type: 'ERROR', message: errorMessage });
        },
      }
    );
  };

  return { compress, status, setStatus };
}

export default useCompress;
