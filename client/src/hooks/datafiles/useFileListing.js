import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { parse } from 'query-string';

function useFileListing(section = 'FilesListing') {
  const dispatch = useDispatch();
  const { query_string: queryString, filter } = parse(useLocation().search);

  const {
    data,
    loading,
    error,
    params,
    loadingScroll,
    reachedEnd
  } = useSelector(
    state => ({
      data: state?.files?.listing?.[section],
      loading: state?.files?.loading?.[section],
      loadingScroll: state?.files?.loadingScroll?.[section],
      error: state?.files?.error?.[section],
      params: state?.files?.params?.[section],
      reachedEnd: state?.files?.reachedEnd?.[section]
    }),
    shallowEqual
  );

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
          section
        }
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
        nextPageToken: data.nextPageToken
      }
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
    fetchMore
  };
}

export default useFileListing;
