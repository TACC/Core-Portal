import { findSystemOrProjectDisplayName } from 'utils/systems';
import { useSelector } from 'react-redux';

function useSystemDisplayName({ scheme, system, path }) {
  const systemList = useSelector(
    (state) => state.systems?.storage?.configuration ?? []
  );
  const projectsList = useSelector(
    (state) => state?.projects?.listing?.projects ?? []
  );
  const projectTitle = useSelector(
    (state) => state.projects?.metadata?.title ?? 'Workspace'
  );
  const systemDisplayName = findSystemOrProjectDisplayName(
    scheme,
    systemList,
    projectsList,
    system,
    path,
    projectTitle
  );

  return systemDisplayName;
}

export default useSystemDisplayName;
