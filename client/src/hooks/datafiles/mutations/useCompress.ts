import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { fetchCreateProject } from 'redux/sagas/projects.sagas';
import { getCompressParams } from 'utils/getCompressParams';
import { apiClient } from 'utils/apiClient';
import { TTapisSystem, TAppFileInput, TTapisJob, TJobArgSpecs, TJobKeyValuePair, TTapisFile } from 'utils/types';


export type TJobPostOperations = 'resubmitJob' | 'cancelJob' | 'submitJob';

export type TParameterSetSubmit = {
  appArgs: TJobArgSpecs;
  containerArgs: TJobArgSpecs;
  schedulerOptions: TJobArgSpecs;
  envVariables: TJobKeyValuePair[];
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
  name: string;
  archiveSystemId?: string;
  archiveSystemDir?: string;
};

export interface TJobSubmit extends TConfigurationValues, TOutputValues {
  archiveOnAppError?: boolean;
  appId: string;
  appVersion: string;
  fileInputs?: TAppFileInput[];
  parameterSet?: TParameterSetSubmit;
}

export type TJobBody = {
  operation: TJobPostOperations;
  uuid?: string;
  job?: TJobSubmit;
  licenseType?: string;
  isInteractive?: boolean;
};

interface IJobPostResponse extends TTapisJob {
  execSys?: TTapisSystem;
}

type TJobPostResponse = {
  response: IJobPostResponse;
  status: number;
};

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

  // Set the state
  const compressAppId = useSelector(
    (state: any) => state.workbench.config.compressApp
  );

  // Set the allocation
  const defaultAllocation = useSelector(
    (state: any) =>
      state.allocations.portal_alloc || state.allocations.active[0].projectName
  );

  const systems = useSelector((state: any) => state.systems.storage.configuration);

  dispatch({
    type: 'DATA_FILES_SET_OPERATION_STATUS',
    payload: { status: 'RUNNING', operation: 'compress' },
  });

  const { mutate } = useMutation({ mutationFn: submitJobUtil });

  const compress = ({scheme, files, filename, compressionType}: {scheme: string; files: TTapisFile[]; filename: string; compressionType: string;}) => {
    // dispatch({
    //   type: 'DATA_FILES_SET_OPERATION_STATUS',
    //   payload: { status: { type: 'RUNNING' }, operation: 'compress' },
    // });
    setStatus({ type: 'RUNNING' });

    let defaultPrivateSystem: any;

    if (scheme !== 'private' && scheme !== 'projects') {
      defaultPrivateSystem = (systems: any) =>
        systems.find((s: any) => s.default);

      if (!defaultPrivateSystem) {
        throw new Error('Folder downloads are unavailable in this portal', {
          cause: 'compressError',
        });
      }
    }

    console.log('Default Private System:', defaultPrivateSystem); // Displays a template literal; not working correctly

    // const params = compressFilesUtil(payload);
    const params = getCompressParams(
      // Doesn't work yet
      files,
      filename,
      compressionType,
      defaultPrivateSystem,
      compressAppId,
      defaultAllocation
    );

    mutate(
      {
        operation: 'submitJob';
        job: params;
      },
      {
        onSuccess: (response: any) => {
          // If the execution system requires pushing keys, then
          // bring up the modal and retry the compress action
          if (res.execSys) {
            yield put({
              type: 'SYSTEMS_TOGGLE_MODAL',
              payload: {
                operation: 'pushKeys',
                props: {
                  onSuccess: action,
                  system: res.execSys,
                  onCancel: compressErrorAction('An error has occurred'),
                },
              },
            });
          } else if (res.status === 'PENDING') {
            yield put({
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
            });
          } else {
            throw new Error('Unable to compress files', { cause: 'compressError' });
          }
          console.log('It worked!');
          if (response.status === 'PENDING') {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
            });
            console.log('It REALLY worked!');
          }
        },
        onError: () => {
          dispatch({
            type: 'DATA_FILES_SET_OPERATION_STATUS',
            payload: {
              status: { type: 'ERROR', operation: 'compress' },
            },
          });
          console.log('Nope');
        },
      }
    );
  };

  return { compress, status, setStatus };
}

export default useCompress;
