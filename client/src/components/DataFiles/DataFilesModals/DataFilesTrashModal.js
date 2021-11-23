import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelectedFiles, useFileListing, useModal } from 'hooks/datafiles';
import { useTrash } from 'hooks/datafiles/mutations';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';

const DataFilesTrashModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const { trash, status, setStatus } = useTrash();

  const dispatch = useDispatch();
  const { params } = useFileListing('FilesListing');

  const { getStatus: isOpen, toggle: toggleModal } = useModal();
  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const [disabled, setDisabled] = useState(false);
  const toggle = () => toggleModal({ operation: 'trash', props: {} });

  const onClosed = () => {
    setDisabled(false);
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    setStatus({});
  };

  const trashCallback = useCallback(() => {
    setDisabled(true);
    const filteredSelected = selected.filter(f => status[f.id] !== 'SUCCESS');
    trash({ selection: filteredSelected, callback: reloadPage });
  }, [selected, reloadPage]);

  return (
    <Modal
      isOpen={isOpen('trash')}
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
