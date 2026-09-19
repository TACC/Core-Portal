import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useRename } from './mutations';
import { parse } from 'query-string';

function useFileListing(section = 'FilesListing') {
  const dispatch = useDispatch();
  const { query_string: queryString, filter } = parse(useLocation().search);
  const { status: renameStatus } = useRename();

  const rawListing = useSelector((state) => state?.files?.listing?.[section]);
  const trashStatus = useSelector((state) => state.files.operationStatus.trash);
  const selectedFiles = useSelector(
    (state) => state.files.selected?.FilesListing
  );
  const loading = useSelector((state) => state?.files?.loading?.[section]);
  const loadingScroll = useSelector(
    (state) => state?.files?.loadingScroll?.[section]
  );
  const error = useSelector((state) => state?.files?.error?.[section]);
  const params = useSelector((state) => state?.files?.params?.[section]);
  const reachedEnd = useSelector(
    (state) => state?.files?.reachedEnd?.[section]
  );

  const data = useMemo(() => {
    // Pinpoints currently selected file once before map iteration
    const selected = selectedFiles || [];
    const selectedFileIndex = selected.length === 1 ? selected[0] : -1;
    // Conditional logic for returning a RUNNING status
    const isRenameRunning = renameStatus === 'RUNNING';

    return rawListing?.map((file, index) => {
      const isTrashRunning =
        !!trashStatus && trashStatus[file.system + file.path] === 'RUNNING';
      return {
        ...file,
        disabled:
          isTrashRunning || (isRenameRunning && index === selectedFileIndex),
      };
    });
  }, [rawListing, trashStatus, selectedFiles, renameStatus]);

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
    if (reachedEnd || loadingScroll || loading) return;
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
  }, [
    dispatch,
    params,
    section,
    data,
    queryString,
    filter,
    reachedEnd,
    loadingScroll,
    loading,
  ]);

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
