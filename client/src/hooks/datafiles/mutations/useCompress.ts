import { useSelector, useDispatch, shallowEqual } from 'react-redux';
// import { useMutation } from '@tanstack/react-query';
// import { apiClient } from 'utils/apiClient';
// import axios, { AxiosError } from 'axios';

// Declare variables to eliminate TypeScript errors
// declare var put: any;
// declare var select: any;
// declare var call: any;

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

  const compress = (payload: any) => {
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload,
    });
  };

  return { compress, status, setStatus };
}

export default useCompress;
