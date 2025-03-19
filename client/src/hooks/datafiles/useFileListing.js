import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useRename } from './mutations';
import { parse } from 'query-string';

function useFileListing(section = 'FilesListing') {
  const dispatch = useDispatch();
  const { query_string: queryString, filter } = parse(useLocation().search);
  const { status: renameStatus } = useRename();
  const { data, loading, error, params, loadingScroll, reachedEnd } =
    useSelector((state) => {
      // Pinpoints currently selected file once before map iteration
      const selectedFiles = state.files.selected?.FilesListing || [];
      const selectedFileIndex =
        selectedFiles.length === 1 ? selectedFiles[0] : -1;
      // Conditional logic for returning a RUNNING status
      const isRenameRunning = renameStatus === 'RUNNING';
      return {
        data: state?.files?.listing?.[section]?.map((file, index) => {
          const isTrashRunning =
            !!state.files.operationStatus.trash &&
            state.files.operationStatus.trash[file.system + file.path] ===
              'RUNNING';
          return {
            ...file,
            disabled:
              isTrashRunning ||
              (isRenameRunning && index === selectedFileIndex),
          };
        }),
        loading: state?.files?.loading?.[section],
        loadingScroll: state?.files?.loadingScroll?.[section],
        error: state?.files?.error?.[section],
        params: state?.files?.params?.[section],
        reachedEnd: state?.files?.reachedEnd?.[section],
      };
    }, shallowEqual);

  const fetchListing = useCallback(
    ({ api, scheme, system, path, limit }) => {
      dispatch({
        type: section !== 'modal' ? 'FETCH_FILES' : 'FETCH_FILES_MODAL',
        payload: {
          api,
          scheme,
          system,
          path,
          limit: limit ?? 100,
          queryString: section === 'FilesListing' ? queryString : null,
          filter: section === 'FilesListing' ? filter : null,
          section,
        },
      });
    },
    [dispatch, queryString, filter, section]
  );

  const fetchMore = useCallback(() => {
    dispatch({
      type: 'SCROLL_FILES',
      payload: {
        api: params.api,
        scheme: params.scheme,
        system: params.system,
        path: params.path || '/',
        section,
        offset: data.length,
        queryString,
        filter,
        nextPageToken: data.nextPageToken,
      },
    });
  }, [dispatch, params, section, data, queryString, filter]);

  return {
    data,
    loading,
    error,
    params,
    loadingScroll,
    reachedEnd,
    fetchListing,
    fetchMore,
  };
}

export default useFileListing;
