import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalListingTable from './DataFilesModalTables/DataFilesModalListingTable';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';
import DataFilesSystemSelector from '../DataFilesSystemSelector/DataFilesSystemSelector';

const DataFilesCopyModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();

  const dispatch = useDispatch();
  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const modalParams = useSelector(
    state => state.files.params.modal,
    shallowEqual
  );
  const reloadPage = () => {
    history.push(location.pathname);
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...modalParams, section: 'modal' }
    });
  };
  const files = useSelector(state => state.files.listing.modal, shallowEqual);
  const isOpen = useSelector(state => state.files.modals.copy);
  const status = useSelector(
    state => state.files.operationStatus.copy,
    shallowEqual
  );
  const [disabled, setDisabled] = useState(false);

  const selectedFiles = useSelector(
    state =>
      state.files.selected.FilesListing.map(i => ({
        ...state.files.listing.FilesListing[i],
        id: uuidv4()
      })),
    () => true
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'copy', props: {} }
    });

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' }
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'copy', status: {} }
    });
    setDisabled(false);
  };

  const copyCallback = useCallback(
    (system, path, name) => {
      setDisabled(true);
      const filteredSelected = selected
        .filter(f => status[f.id] !== 'SUCCESS')
        .map(f => ({ ...f, api: params.api }));
      dispatch({
        type: 'DATA_FILES_COPY',
        payload: {
          dest: { system, path, api: modalParams.api, name },
          src: filteredSelected,
          reloadCallback: reloadPage
        }
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
            selectedFiles.map(f => f.system).includes(system) &&
            selectedFiles.map(f => f.path).includes(path)
          )
        )
      );
    },
    [selectedFiles]
  );

  const actionString = `Copying ${selected.length} File${
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
      <ModalHeader toggle={toggle}>Copy</ModalHeader>
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
              <DataFilesModalSelectedTable data={selected} operation="copy" />
            </div>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <div className="dataFilesModalColHeader">
              Destination
              <DataFilesSystemSelector
                systemId={modalParams.system}
                section="modal"
                disabled={disabled}
              />
            </div>
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
                operationName="Copy"
                operationCallback={copyCallback}
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

export default DataFilesCopyModal;
