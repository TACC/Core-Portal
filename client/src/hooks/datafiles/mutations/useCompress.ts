import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { fetchCreateProject } from 'redux/sagas/projects.sagas';
// import { compressAppSelector } from 'redux/sagas/datafiles.sagas';
import { fetchUtil } from 'utils/fetchUtil';

// Type declaration to be used for latestCompress
type TCompressApp = {
  definition: {
    id: string, version: string, jobAttributes: {
      execSystemId: string
    }
  }
}

type TPayload = {
  payload: any;
}

export async function compressFilesUtil({
  files,
  archiveFileName,
  compressionType,
  defaultPrivateSystem,
  // latestCompress,
  defaultAllocation,
  action,
  // compressApp,
  // defaultAllocation,
  latestCompress,
  // systems,
  params,
  res
}: {
  files: any[];
  archiveFileName: string;
  compressionType: string;
  defaultPrivateSystem: any;
  latestCompress: any; 
  defaultAllocation: string; 
  action: any;
  // compressApp: (useSelector: any) => any;
  // defaultAllocation: (useSelector: any) => void;
  // latestCompress: (useCallback: any) => void;
  // systems: (useSelector: any) => any;
  params: (getCompressParams: any) => any;
  res: (useCallback: any) => any;
}) {
  const fileInputs = files.map((file: any) => ({
    sourceUrl: `tapis://${file.system}/${file.path}`,
  }));
  console.log(fileInputs);

  let archivePath, archiveSystem;
  // let defaultPrivateSystem: any;

  if (defaultPrivateSystem) {
    archivePath = defaultPrivateSystem.homeDir;
    archiveSystem = defaultPrivateSystem.system;
  } else {
    archivePath = `${files[0].path.slice(0, -files[0].name.length)}`;
    archiveSystem = files[0].system;
  }

  // const compressAppSelector = (state: any) => state.workbench.config.compressApp;
  // const compressApp = await useSelector(compressAppSelector); // ERROR
  // const compressApp = (state: any) => useSelector(state.workbench.config.compressApp);

  // const defaultAllocationSelector = (state: any) => 
    // state.allocations.portal_alloc || state.allocations.active[0].projectName;
  // const defaultAllocation = await useSelector(defaultAllocationSelector);
  // defaultAllocationSelector(useSelector(defaultAllocationSelector));
  // const defaultAllocation = (state: any) => useSelector(
  //   state.allocations.portal_alloc || state.allocations.active[0].projectName
  // );

  // async function fetchAppDefinitionUtil(appId: string, appVersion: string) {
  //   const params = { appId, appVersion };
  //   if (appVersion) {
  //     params.appVersion = appVersion;
  //   }
  //   const result = await fetchUtil({
  //     url: '/api/workspace/apps',
  //     params,
  //   });
  //   return result.response;
  // };
  // latestCompress((compressApp: any) =>
  //   useCallback(
  //     fetchAppDefinitionUtil, compressApp(
  //       useSelector(compressAppSelector)
  //     )
  //   )
  // );
  // const latestCompress = (compressApp: any) => useCallback(fetchAppDefinitionUtil, compressApp);
  // latestCompress();

  // const systemsSelector = (state: any) => state.systems.storage.configuration;
  // const systems = useSelector(systemsSelector);

  if (
    action.payload.scheme !== 'private' && 
    action.payload.scheme !== 'projects'
  ) {
    defaultPrivateSystem = (systems: any) => systems.find((s: any) => s.default);

    if (!defaultPrivateSystem) {
      throw new Error('Folder downloads are unavailable in this portal', {
        cause: 'compressError',
      });
    }
  }

  // params(compressFilesUtil(action));

  // res(
  //   useCallback(
  //     jobHelper, params(
  //       compressFilesUtil(action)
  //     )
  //   )
  // );

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
  console.log(result); // Does not display anything
  return result;
};

// Sets up the parameters for the compression job
// export function getCompressParams({
//   files,
//   archiveFileName,
//   compressionType,
//   defaultPrivateSystem,
//   latestCompress,
//   defaultAllocation
// }: {
//   files: any[];
//   archiveFileName: string;
//   compressionType: string;
//   defaultPrivateSystem: any;
//   // latestCompress: ({
//   //   definition: ({
//   //     id: string, version: string, jobAttributes: ({
//   //       execSystemId: string;
//   //     })
//   //   })
//   // });
//   // latestCompress: TCompressApp;
//   latestCompress: any;
//   defaultAllocation: string;
// }): string {
//   const fileInputs = files.map((file: any) => ({
//     sourceUrl: `tapis://${file.system}/${file.path}`,
//   }));
//   // This works!
//   console.log(fileInputs);

//   let archivePath, archiveSystem;

//   if (defaultPrivateSystem) {
//     archivePath = defaultPrivateSystem.homeDir;
//     archiveSystem = defaultPrivateSystem.system;
//   } else {
//     archivePath = `${files[0].path.slice(0, -files[0].name.length)}`;
//     archiveSystem = files[0].system;
//   }

//   // This console.log does NOT work. Returns undefined
//   console.log(latestCompress);
//   const result = JSON.stringify({
//     job: {
//       fileInputs: fileInputs,
//       // Broken here; still doesn't know the definition
//       name: `${latestCompress.definition.id}-${
//         latestCompress.definition.version
//       }_${new Date().toISOString().split('.')[0]}`,
//       archiveSystemId: archiveSystem,
//       archiveSystemDir: archivePath,
//       archiveOnAppError: false,
//       appId: latestCompress.definition.id,
//       appVersion: latestCompress.definition.version,
//       parameterSet: {
//         appArgs: [
//           {
//             name: 'Archive File Name',
//             arg: archiveFileName,
//           },
//           {
//             name: 'Compression Type',
//             arg: compressionType,
//           },
//         ],
//         schedulerOptions: [
//           {
//             name: 'TACC Allocation',
//             description:
//               'The TACC allocation associated with this job execution',
//             include: true,
//             arg: `-A ${defaultAllocation}`,
//           },
//         ],
//       },
//       execSystemId: latestCompress.definition.jobAttributes.execSystemId,
//     },
//   });
//   console.log(result);
//   return result;
// };

// Sends out the call to the TAPIS app
// export function compressFiles({
//   action,
//   compressApp,
//   defaultAllocation,
//   latestCompress,
//   systems,
//   params,
//   res
// }: {
//   action: any;
//   compressApp: (useSelector: any) => any;
//   defaultAllocation: (useSelector: any) => void;
//   latestCompress: (useCallback: any) => void;
//   systems: (useSelector: any) => any;
//   params: (getCompressParams: any) => any;
//   res: (useCallback: any) => any;
// }) {

//   const compressAppSelector = (state: any) => state.workbench.config.compressApp;
//   compressApp(useSelector(compressAppSelector));

//   const defaultAllocationSelector = (state: any) => 
//     state.allocations.portal_alloc || state.allocations.active[0].projectName;
//   defaultAllocation(useSelector(defaultAllocationSelector));

//   async function fetchAppDefinitionUtil(appId: string, appVersion: string) {
//     const params = { appId, appVersion };
//     if (appVersion) {
//       params.appVersion = appVersion;
//     }
//     const result = await fetchUtil({
//       url: '/api/workspace/apps',
//       params,
//     });
//     return result.response;
//   };
//   latestCompress(
//     useCallback(
//       fetchAppDefinitionUtil, compressApp(
//         useSelector(compressAppSelector)
//       )
//     )
//   );

//   const systemsSelector = (state: any) => state.systems.storage.configuration;
//   systems(useSelector(systemsSelector));

//   let defaultPrivateSystem: any;

//   if (
//     action.payload.scheme !== 'private' &&
//     action.payload.scheme !== 'projects'
//   ) {
//     defaultPrivateSystem = (systems: any) => systems.find((s: any) => s.default);

//     if (!defaultPrivateSystem) {
//       throw new Error('Folder downloads are unavailable in this portal', {
//         cause: 'compressError',
//       });
//     }
//   }

//   params(getCompressParams(action));
//   // Original Code:
//   // const params = (getCompressParams: any) => getCompressParams(
//   //   action.payload.files,
//   //   action.payload.filename,
//   //   action.payload.compressionType,
//   //   defaultPrivateSystem,
//   //   latestCompress,
//   //   defaultAllocation
//   // );

//   res(
//     useCallback(
//       jobHelper, params(
//         getCompressParams(action)
//       )
//     )
//   );

//     // If the execution system requires pushing keys, then
//     // bring up the modal and retry the compress action
//     if (res.execSys) {
//       dispatch({
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
//       dispatch({
//         type: 'DATA_FILES_SET_OPERATION_STATUS',
//         payload: { status: { type: 'SUCCESS' }, operation: 'compress' },
//       });
//     } else {
//       throw new Error('Unable to compress files', { cause: 'compressError' });
//     }
//     if (action.payload.onSuccess) {
//       yield put(action.payload.onSuccess);
//     }
//     try {
//     } catch (error: any) {
//       const errorMessage =
//         error.cause === 'compressError' ? error.message : 'An error has occurred';

//       yield put(compressErrorAction(errorMessage));
//     }
// };

// Assigns the job to the supercomputer and returns the actual compressed file?
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
  const compressAppSelector = (state: any) => state.workbench.config.compressApp;
  const compressApp = useSelector(compressAppSelector);

  // Set the allocation
  const defaultAllocationSelector = (state: any) => 
    state.allocations.portal_alloc || state.allocations.active[0].projectName;
  const defaultAllocation = useSelector(defaultAllocationSelector);

  // Actually makes the call
  async function fetchAppDefinitionUtil(appId: string, appVersion: string) {
    console.log('Marker 1'); // Does nothing
    const params = { appId, appVersion };
    if (appVersion) {
      params.appVersion = appVersion;
    }
    const result = await fetchUtil({
      url: '/api/workspace/apps',
      params,
    });
    console.log('Result: ',result); // Does nothing
    console.log('Response: ',result.response); // Does nothing
    return result.response;
  };
  const latestCompress = useCallback(fetchAppDefinitionUtil, compressApp);
  // const latestCompress = await fetchAppDefinitionUtil(compressApp);

  // Set the state back to where it was
  const systemsSelector = (state: any) => state.systems.storage.configuration;
  const systems = useSelector(systemsSelector);

  // latestCompress(
  //   useCallback(
  //     fetchAppDefinitionUtil, compressApp(
  //       useSelector(compressAppSelector)
  //     )
  //   )
  // );
  
  // Maybe this was right all along?
  const { mutate } = useMutation({ mutationFn: jobHelper });
  
  const compress = (payload: any) => {
    // dispatch({
    //   type: 'DATA_FILES_SET_OPERATION_STATUS',
    //   payload: { status: { type: 'RUNNING' }, operation: 'compress' },
    // });
    setStatus({ type: 'RUNNING' });

    let defaultPrivateSystem: any;

    if (
      payload.scheme !== 'private' &&
      payload.scheme !== 'projects'
    ) {
      defaultPrivateSystem = (systems: any) => systems.find((s: any) => s.default);
  
      if (!defaultPrivateSystem) {
        throw new Error('Folder downloads are unavailable in this portal', {
          cause: 'compressError',
        });
      }
    }

    const getCompressParams = (
      files: any[],
      archiveFileName: string,
      compressionType: string,
      defaultPrivateSystem: any,
      latestCompress: any,
      defaultAllocation: string
    ) => {
      const fileInputs = files.map((file) => ({
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
    
      console.log(latestCompress); // Sort of works
      console.log(latestCompress.definition); // Returns undefined

      return JSON.stringify({
        job: {
          fileInputs: fileInputs,
          name: `${latestCompress.definition.id}-${ // id is not being read yet
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
    };

    console.log(payload); // This works
    console.log('Default Private System:', defaultPrivateSystem); // Displays a template literal; not working correctly

    // const params = compressFilesUtil(payload);
    const params = getCompressParams( // Doesn't work yet
      payload.files,
      payload.filename,
      payload.compressionType,
      defaultPrivateSystem,
      latestCompress,
      defaultAllocation
    );

    

    mutate(
      {
        params
      },
      {
        onSuccess: (response: any) => {
          dispatch({
            type: 'SYSTEMS_TOGGLE_MODAL',
            payload: {
              operation: 'pushKeys',
              props: {
                onSuccess: payload,
                system: response.execSys,
                onCancel: 'An error has occurred',
              },
            },
          });
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
            }
          });
          console.log('Nope');
        }
      }
    );
  };

  return { compress, status, setStatus };
}

export default useCompress;
