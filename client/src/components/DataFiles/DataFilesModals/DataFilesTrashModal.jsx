import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';

const DataFilesTrashModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const dispatch = useDispatch();
  const params = useSelector(
    (state) => state.files.params.FilesListing,
    shallowEqual
  );

  const isOpen = useSelector((state) => state.files.modals.trash);
  const selectedFiles = useSelector((state) =>
    state.files.selected.FilesListing.map((i) => ({
      ...state.files.listing.FilesListing[i],
      id: uuidv4(),
    }))
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const status = useSelector((state) => state.files.operationStatus.trash);
  const [disabled, setDisabled] = useState(false);
  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'trash', props: {} },
    });

  const onClosed = () => {
    setDisabled(false);
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'trash', status: {} },
    });
  };

  const trashCallback = useCallback(() => {
    setDisabled(true);
    const filteredSelected = selected.filter((f) => status[f.id] !== 'SUCCESS');
    dispatch({
      type: 'DATA_FILES_TRASH',
      payload: {
        src: filteredSelected,
        reloadCallback: reloadPage,
      },
    });
  }, [selected, reloadPage]);

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      size="lg"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Moving {selected.length} File(s) to Trash
      </ModalHeader>
      <ModalBody style={{ height: '70vh' }}>
        <div className="row h-100">
          <div className="col-md-12 d-flex flex-column">
            {/* Table of selected files */}
            <DataFilesBreadcrumbs
              api={params.api}
              scheme={params.scheme}
              system={params.system}
              path={params.path || '/'}
              section=""
            />
            <div className="filesListing">
              <DataFilesModalSelectedTable data={selected} operation="trash" />
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          disabled={disabled}
          onClick={trashCallback}
          className="data-files-btn"
        >
          Trash
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default DataFilesTrashModal;
