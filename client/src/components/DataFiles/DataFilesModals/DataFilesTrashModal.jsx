import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button } from '_common';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrash } from 'hooks/datafiles/mutations';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';
import {
  useSelectedFiles,
  useFileListing,
  useSystems,
  useModal,
} from 'hooks/datafiles';

const DataFilesTrashModal = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { params } = useFileListing('FilesListing');

  const { trash, status, setStatus } = useTrash();
  const { getStatus: getModalStatus, toggle: toggleModal } = useModal();
  const { fetchSelectedSystem } = useSystems();
  const selectedSystem = fetchSelectedSystem(params);
  const isOpen = getModalStatus('trash');
  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const dispatch = useDispatch();
  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    setStatus({});
  };

  const toggle = () => toggleModal({ operation: 'trash', props: {} });

  const reloadPage = () => {
    navigate(location.pathname);
    console.info('reloadPage called: ', location.pathname);
  };
  const trashCallback = useCallback(() => {
    console.info('trashCallback called');
    // Specific handling for shared workspaces.
    const homeDir = selectedSystem?.homeDir || '';
    const destSystem = selectedFiles[0]?.system || selectedSystem?.system;
    if (!destSystem) return;

    trash({
      destSystem,
      homeDir,
      callback: reloadPage,
    });
    toggle();
  }, [selected, reloadPage, status]);

  const actionString = `Moving ${selected.length} File${
    selected.length > 1 ? 's' : ''
  } to Trash`;

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charcode="&#xe912;">
        Move to Trash
      </ModalHeader>
        <ModalBody style={{ height: '40vh' }}>
          <div className="row h-100">
            <div className="col-md-12 d-flex flex-column">
              {/* Table of selected files */}
              <div className="dataFilesModalColHeader">{actionString}</div>
              <div className="filesListing">
                <DataFilesModalSelectedTable data={selected} operation="trash" />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            isLoading={status.type === 'RUNNING'}
            type="primary"
            size="long"
            iconNameBefore={status.type === 'ERROR' ? 'alert' : null}
            attr="submit"
            onClick={trashCallback}
          >
            Move to Trash
          </Button>
        </ModalFooter>
    </Modal>
  );
});

export default DataFilesTrashModal;
