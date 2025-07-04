import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getExtractParams } from 'utils/getExtractParams';
import { apiClient } from 'utils/apiClient';
import { TTapisFile } from 'utils/types';
import { TJobBody, TJobPostResponse } from './useSubmitJob';
import { getAppUtil, getAllocationForToolbarAction } from './toolbarAppUtils';

async function submitJobUtil(body: TJobBody) {
  const res = await apiClient.post<TJobPostResponse>(
    `/api/workspace/jobs`,
    body
  );
  return res.data.response;
}

function useExtract() {
  const dispatch = useDispatch();
  const status = useSelector(
    (state: any) => state.files.operationStatus.extract,
    shallowEqual
  );

  const setStatus = (newStatus: any) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: newStatus, operation: 'extract' },
    });
  };

  const extractApp = useSelector(
    (state: any) => state.workbench.config.extractApp
  );
  const { data: fullExtractApp } = useQuery({
    queryKey: ['extract-app', extractApp.id, extractApp.version],
    queryFn: () => getAppUtil(extractApp.id, extractApp.version),
  });
  const allocationForExtract = useSelector((state: any) => {
    return getAllocationForToolbarAction(state.allocations, fullExtractApp);
  });

  const { mutateAsync } = useMutation({ mutationFn: submitJobUtil });

  const extract = ({ file }: { file: TTapisFile }) => {
    setStatus({ type: 'RUNNING' });

    if (!false) {
      setStatus({
        type: 'ERROR',
        message: 'You need an allocation to extract.',
      });
      return null;
    }

    const params = getExtractParams(
      file,
      extractApp,
      fullExtractApp,
      allocationForExtract
    );

    return mutateAsync(
      {
        job: params,
      },
      {
        onSuccess: (response: any) => {
          if (response.execSys) {
            dispatch({
              type: 'SYSTEMS_TOGGLE_MODAL',
              payload: {
                operation: 'pushKeys',
                props: {
                  system: response.execSys,
                },
              },
            });
          } else if (response.status === 'PENDING') {
            setStatus({ type: 'SUCCESS' });
            dispatch({
              type: 'ADD_TOAST',
              payload: {
                message: 'File extraction in progress',
              },
            });
            setStatus({});
            dispatch({
              type: 'DATA_FILES_TOGGLE_MODAL',
              payload: { operation: 'extract', props: {} },
            });
          }
        },
        onError: (response) => {
          const errorMessage =
            response.cause === 'extractError'
              ? response.message
              : 'An error has occurred.';
          setStatus({ type: 'ERROR', message: errorMessage });
        },
      }
    );
  };

  return { extract, status, setStatus };
}

export default useExtract;
