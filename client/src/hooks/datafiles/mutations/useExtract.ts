import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getExtractParams } from 'utils/getExtractParams';
import { apiClient } from 'utils/apiClient';
import { fetchUtil } from 'utils/fetchUtil';
import { TTapisFile } from 'utils/types';
import { TJobBody, TJobPostResponse } from './useSubmitJob';

const getAppUtil = async function fetchAppDefinitionUtil(
  appId: string,
  appVersion: string
) {
  const params = { appId, appVersion };
  const result = await fetchUtil({
    url: '/api/workspace/apps',
    params,
  });
  return result.response;
};

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
  const defaultAllocation = useSelector((state: any) => {
    if (state.allocations.portal_alloc) {
      return state.allocations.portal_alloc;
    }
    if (
      Array.isArray(state.allocations.active) &&
      state.allocations.active.length > 0
    ) {
      return state.allocations.active[0].projectName || null;
    }
    return null;
  });

  const { data: latestExtract } = useQuery({
    queryKey: ['extract-app', extractApp.id, extractApp.version],
    queryFn: () => getAppUtil(extractApp.id, extractApp.version),
  });

  const { mutateAsync } = useMutation({ mutationFn: submitJobUtil });

  const extract = ({ file }: { file: TTapisFile }) => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: 'RUNNING', operation: 'extract' },
    });

    const params = getExtractParams(
      file,
      extractApp,
      latestExtract,
      defaultAllocation
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
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: { type: 'SUCCESS' }, operation: 'extract' },
            });
            dispatch({
              type: 'ADD_TOAST',
              payload: {
                message: 'File extraction in progress',
              },
            });
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { operation: 'extract', status: {} },
            });
            dispatch({
              type: 'DATA_FILES_TOGGLE_MODAL',
              payload: { operation: 'extract', props: {} },
            });
          }
        },
        onError: (response) => {
          const errorMessage =
            response.cause === 'compressError'
              ? response.message
              : 'An error has occurred.';
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: {
              status: { type: 'ERROR', message: errorMessage },
              operation: 'extract',
            },
          });
        },
      }
    );
  };

  return { extract, status, setStatus };
}

export default useExtract;
