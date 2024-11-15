import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

function useSystems() {
  const dispatch = useDispatch();

  const fetchSystems = useCallback(() => {
    dispatch({ type: 'FETCH_SYSTEMS' });
  }, [dispatch]);

  const loading = useSelector((state) => state.systems?.storage?.loading);
  const error = useSelector((state) => state.systems?.storage?.error);
  const data = useSelector((state) => state.systems?.storage?.configuration);

  const fetchSelectedSystem = useCallback(
    ({ scheme = '', system = '', path = '' }) => {
      return data.find((s) => {
        let isHomeDirInPath = true;

        if (path && s.homeDir) {
          isHomeDirInPath = path
            .replace(/^\/+/, '')
            .startsWith(s.homeDir.replace(/^\/+/, ''));
        }

        return s.system === system && s.scheme === scheme && isHomeDirInPath;
      });
    },
    [data]
  );

  const isRootProjectSystem = useCallback(
    ({ system = '' }) => {
      return data.some((s) => 
        s.scheme === 'projects' && s.system === system
      )
    }
  )

  return { data, loading, error, fetchSystems, fetchSelectedSystem, isRootProjectSystem };
}

export default useSystems;
