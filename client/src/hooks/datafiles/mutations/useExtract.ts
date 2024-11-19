import { useMutation } from '@tanstack/react-query';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getExtractParams } from 'utils/getExtractParams';
import { apiClient } from 'utils/apiClient';
import { fetchUtil } from 'utils/fetchUtil';
import {
  TTapisSystem,
  TAppFileInput,
  TTapisJob,
  TJobArgSpecs,
  TJobKeyValuePair,
  TTapisFile,
} from 'utils/types';

export type TJobPostOperations = 'resubmitJob' | 'cancelJob' | 'submitJob';

export type TParameterSetSubmit = {
  appArgs?: TJobArgSpecs;
  containerArgs?: TJobArgSpecs;
  schedulerOptions?: TJobArgSpecs;
  envVariables?: TJobKeyValuePair[];
};

export type TConfigurationValues = {
  execSystemId?: string;
  execSystemLogicalQueue?: string;
  maxMinutes?: number;
  nodeCount?: number;
  coresPerNode?: number;
  allocation?: string;
  memoryMB?: number;
};

export type TOutputValues = {
  name?: string;
  archiveSystemId?: string;
  archiveSystemDir?: string;
};

export interface TJobSubmit extends TConfigurationValues, TOutputValues {
  archiveOnAppError?: boolean;
  appId?: string;
  fileInputs?: TAppFileInput[];
  parameterSet?: TParameterSetSubmit;
}

export type TJobBody = {
  operation?: TJobPostOperations;
  uuid?: string;
  job: TJobSubmit;
  licenseType?: string;
  isInteractive?: boolean;
  execSystemId?: string;
};

interface IJobPostResponse extends TTapisJob {
  execSys?: TTapisSystem;
}

type TJobPostResponse = {
  response: IJobPostResponse;
  status: number;
};

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

  const defaultAllocation = useSelector(
    (state: any) =>
      state.allocations.portal_alloc || state.allocations.active[0].projectName
  );

  const latestExtract = getAppUtil(extractApp.id, extractApp.version);

  const { mutate } = useMutation({ mutationFn: submitJobUtil });

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
    console.log(params);

    mutate(
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
