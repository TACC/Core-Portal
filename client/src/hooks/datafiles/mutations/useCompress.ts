import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { fetchUtil } from 'utils/fetchUtil';
// import { apiClient } from 'utils/apiClient';
// import axios, { AxiosError } from 'axios';

// export function* compressFiles(action: any) {
//   const compressErrorAction = (errorMessage: string) => {
//     return {
//       type: 'DATA_FILES_SET_OPERATION_STATUS',
//       payload: {
//         status: { type: 'ERROR', message: errorMessage },
//         operation: 'compress',
//       },
//     };
//   };

//   try {
//     yield put({
//       type: 'DATA_FILES_SET_OPERATION_STATUS',
//       payload: { status: { type: 'RUNNING' }, operation: 'compress' },
//     });

//     // Re-establish variables as functions in TypeScript
//     const compressAppSelector = (state: any) => state.workbench.config.compressApp;
//     const compressApp = () => useSelector(compressAppSelector);

//     const defaultAllocationSelector = (state: any) => 
//       state.allocations.portal_alloc || state.allocations.active[0].projectName;
//     const defaultAllocation = () => useSelector(defaultAllocationSelector);

//     const latestCompress = () => yield call(fetchAppDefinitionUtil, compressApp);

//     const systemsSelector = (state: any) => state.systems.storage.configuration;
//     const systems = () => useSelector(systemsSelector);
    
//     type TSystem = {
//       find: string;
//     }
//     type TResponse = {
//       systems: TSystem[];
//     }
    
//     // interface systemsEntry {
//     //   id: string;
//     // }
    
//     // const systems: any {
//     //   find,
//     //   selectSystem,
//     // }: {
//     //   find: any;
//     //   selectSystem: any;
//     // }

//     let defaultPrivateSystem: any;

//     if (
//       action.payload.scheme !== 'private' &&
//       action.payload.scheme !== 'projects'
//     ) {
//       defaultPrivateSystem = () => systems.find(((s: any)) => s.default);
//       // defaultPrivateSystem = () => TResponse;

//       if (!defaultPrivateSystem) {
//         throw new Error('Folder downloads are unavailable in this portal', {
//           cause: 'compressError',
//         });
//       }
//     }

//     const params = (getCompressParams: any) => getCompressParams(
//       action.payload.files,
//       action.payload.filename,
//       action.payload.compressionType,
//       defaultPrivateSystem,
//       latestCompress,
//       defaultAllocation
//     );

//     // const res {
//     //   execSys,
//     //   status,
//     //   callJobHelper,
//     // }: {
//     //   execSys: any;
//     //   status: any;
//     //   callJobHelper: any;
//     // }

//     const res = () => yield call(jobHelper, params);
//     // If the execution system requires pushing keys, then
//     // bring up the modal and retry the compress action
//     if (res.execSys) {
//       yield put({
//         type: 'SYSTEMS_TOGGLE_MODAL',
//         payload: {
//           operation: 'pushKeys',
//           props: {
//             onSuccess: action,
//             system: res.execSys,
//             onCancel: compressErrorAction('An error has occurred'),
//           },
//         },
//       });
//     } else if (res.status === 'PENDING') {
//       yield put({
//         type: 'DATA_FILES_SET_OPERATION_STATUS',
//         payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
//       });
//     } else {
//       throw new Error('Unable to compress files', { cause: 'compressError' });
//     }
//     if (action.payload.onSuccess) {
//       yield put(action.payload.onSuccess);
//     }
//   } catch (error: any) {
//     const errorMessage =
//       error.cause === 'compressError' ? error.message : 'An error has occurred';

//     yield put(compressErrorAction(errorMessage));
//   }
// }

export async function jobHelper(body: any) {
  const url = '/api/workspace/jobs';
  const res = await fetchUtil({ url, method: 'POST', params: body });
  return res.response;
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
  
  const { mutate } = useMutation({ mutationFn: jobHelper });
  
  const compress = (payload: any) => {
    const compressErrorAction = (errorMessage: string) => {
      return {
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: {
          status: { type: 'ERROR', message: errorMessage },
          operation: 'compress',
        },
      };
    };
    
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: { type: 'RUNNING' }, operation: 'compress' },
    });
    
    const compressAppSelector = (state: any) =>
      state.workbench.config.compressApp;
    const compressApp = useSelector(compressAppSelector);
    
    const defaultAllocationSelector = (state: any) =>
      state.allocations.portal_alloc || state.allocations.active[0].projectName;
    const defaultAllocation = useSelector(defaultAllocationSelector);
    
    async function fetchAppDefinitionUtil(appId: string, appVersion: string) {
      const params = { appId, appVersion };
      if (appVersion) {
        params.appVersion = appVersion;
      }
      const result = await fetchUtil({
        url: '/api/workspace/apps',
        params,
      });
      return result.response;
    }
    const latestCompress = useCallback(fetchAppDefinitionUtil, compressApp);
    
    const systemsSelector = (state: any) => state.systems.storage.configuration;
    const systems = useSelector(systemsSelector);
    
    let defaultPrivateSystem;
    
    if (
      payload.scheme !== 'private' &&
      payload.scheme !== 'projects'
    ) {
      defaultPrivateSystem = systems.find((s: any) => s.default);
      
      if (!defaultPrivateSystem) {
        throw new Error('Folder downloads are unavailable in this portal', {
          cause: 'compressError',
        });
      }
    }
    const getCompressParams = ({
      files,
      archiveFileName,
      compressionType,
      defaultPrivateSystem,
      latestCompress,
      defaultAllocation
    }: {
      files: any[];
      archiveFileName: string;
      compressionType: string;
      defaultPrivateSystem: any;
      latestCompress: any;
      defaultAllocation: string;
    }): string => {
      const fileInputs = files.map((file: any) => ({
        sourceUrl: `tapis://${file.system}/${file.path}`,
      }));
    
      let archivePath, archiveSystem;
    
      if (defaultPrivateSystem) {
        archivePath = defaultPrivateSystem.homeDir;
        archiveSystem = defaultPrivateSystem.system;
      } else {
        archivePath = `${files[0].path.slice(0, -files[0].name.length)}`;
        archiveSystem = files[0].system;
      }
    
      const result = JSON.stringify({
        job: {
          fileInputs: fileInputs,
          name: `${latestCompress.definition.id}-${
            latestCompress.definition.version
          }_${new Date().toISOString().split('.')[0]}`,
          archiveSystemId: archiveSystem,
          archiveSystemDir: archivePath,
          archiveOnAppError: false,
          appId: latestCompress.definition.id,
          appVersion: latestCompress.definition.version,
          parameterSet: {
            appArgs: [
              {
                name: 'Archive File Name',
                arg: archiveFileName,
              },
              {
                name: 'Compression Type',
                arg: compressionType,
              },
            ],
            schedulerOptions: [
              {
                name: 'TACC Allocation',
                description:
                  'The TACC allocation associated with this job execution',
                include: true,
                arg: `-A ${defaultAllocation}`,
              },
            ],
          },
          execSystemId: latestCompress.definition.jobAttributes.execSystemId,
        },
      });
    
      return result;
    };

    const params = getCompressParams(payload);

    mutate(
      // params type may need to be changed from string
      {params},
      {
        onSuccess: (response) => {
          dispatch({
            type: 'SYSTEMS_TOGGLE_MODAL',
            payload: {
              operation: 'pushKeys',
              props: {
                onSuccess: payload,
                system: response.execSys,
                onCancel: compressErrorAction('An error has occurred'),
              },
            },
          });
          if (response.status === 'PENDING') {
            dispatch({
              type: 'DATA_FILES_SET_OPERATION_STATUS',
              payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
            });
          }
        },
        onError: () => {
          compressErrorAction;
        } 
      }
    );

    // dispatch({
    //   type: 'DATA_FILES_COMPRESS',
    //   payload,
    // });
  };

  return { compress, status, setStatus };
}

export default useCompress;
