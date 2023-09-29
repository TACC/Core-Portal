import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import {
  useSelectedFiles,
  useFileListing,
  useSystems,
  useModal,
} from 'hooks/datafiles';

import { useMove } from 'hooks/datafiles/mutations';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalListingTable from './DataFilesModalTables/DataFilesModalListingTable';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';

const DataFilesMoveModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();

  const { params } = useFileListing('FilesListing');
  const {
    params: modalParams,
    data: files,
    fetchListing,
  } = useFileListing('modal');

  const { move, status, setStatus } = useMove();

  const dispatch = useDispatch();
  const { data: systems } = useSystems();

  const { fetchSelectedSystem } = useSystems();

  const selectedSystem = fetchSelectedSystem(params);

  const reloadPage = () => {
    history.push(location.pathname);
    fetchListing(modalParams);
  };

  const { getStatus, toggle: toggleModal } = useModal();

  const isOpen = getStatus('move');
  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const [disabled, setDisabled] = useState(false);

  const toggle = () => toggleModal({ operation: 'move', props: {} });

  const onOpened = () => {
    fetchListing({
      ...params,
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    setStatus({});
    setDisabled(false);
  };

  const moveCallback = useCallback(
    (system, path) => {
      setDisabled(true);
      move({
        destSystem: system,
        destPath: path || '/',
        callback: reloadPage,
      });
    },
    [selected, reloadPage, status]
  );

  const listingFilter = useCallback(
    ({ system, path, format }) => {
      return (
        format === 'folder' &&
        !(
          // Remove files from the listing if they have been selected.
          (
            selectedFiles.map((f) => f.system).includes(system) &&
            selectedFiles.map((f) => f.path).includes(path)
          )
        )
      );
    },
    [selectedFiles]
  );

  const actionString = `Moving ${selected.length} File${
    selected.length > 1 ? 's' : ''
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      size="xl"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Move
      </ModalHeader>
      <ModalBody style={{ height: '70vh' }}>
        <div className="row h-100">
          <div className="col-md-6 d-flex flex-column">
            {/* Table of selected files */}
            <div className="dataFilesModalColHeader">{actionString}</div>
            <DataFilesBreadcrumbs
              api={params.api}
              scheme={params.scheme}
              system={params.system}
              path={params.path || '/'}
              section=""
            />
            <div className="filesListing">
              <DataFilesModalSelectedTable data={selected} operation="move" />
            </div>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <div className="dataFilesModalColHeader">Destination</div>
            <DataFilesBreadcrumbs
              api={modalParams.api}
              scheme={modalParams.scheme}
              system={modalParams.system}
              path={modalParams.path || '/'}
              section="modal"
            />
            <div className="filesListing">
              <DataFilesModalListingTable
                data={files.filter(listingFilter)}
                operationName="Move"
                operationCallback={moveCallback}
                operationOnlyForFolders
                operationAllowedOnRootFolder
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
});

export default DataFilesMoveModal;
