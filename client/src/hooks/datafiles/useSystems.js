import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

function useSystems() {
  const dispatch = useDispatch();

  const fetchSystems = useCallback(() => {
    dispatch({ type: 'FETCH_SYSTEMS' });
  }, [dispatch]);

  const loading = useSelector((state) => state.systems.storage.loading);
  const error = useSelector((state) => state.systems.storage.error);
  const data = useSelector((state) => state.systems.storage.configuration);

  return { data, loading, error, fetchSystems };
}

export default useSystems;
