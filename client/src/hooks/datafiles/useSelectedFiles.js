import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

function useSelectedFiles() {
  const dispatch = useDispatch();

  const selectedIndices = useSelector(
    (state) => state.files.selected.FilesListing
  );
  const listing = useSelector((state) => state.files.listing?.FilesListing);

  const selectedFiles = useMemo(
    () =>
      selectedIndices.map((i) => ({
        ...listing?.[i],
        id: `${listing?.[i].system}/${listing?.[i].path}`,
      })),
    [selectedIndices, listing]
  );

  const allSelected = useSelector(
    (state) => state.files.selectAll?.FilesListing
  );

  const isSelected = (index, section = 'FilesListing') =>
    useSelector((state) =>
      (state.files.selected[section] ?? []).includes(index)
    );

  const selectAll = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_SELECT_ALL',
      payload: { section: 'FilesListing' },
    });
  };

  const selectFile = useCallback(
    (index) => {
      dispatch({
        type: 'DATA_FILES_TOGGLE_SELECT',
        payload: { index, section: 'FilesListing' },
      });
    },
    [dispatch]
  );

  return { selectedFiles, allSelected, isSelected, selectAll, selectFile };
}
export default useSelectedFiles;
