import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

function useSelectedFiles() {
  const dispatch = useDispatch();

  const selectedFiles = useSelector((state) =>
    state.files.selected.FilesListing.map((i) => ({
      ...state.files.listing?.FilesListing[i],
      id: `${state.files.listing?.FilesListing[i].system}/${state.files.listing?.FilesListing[i].path}`,
    }))
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
