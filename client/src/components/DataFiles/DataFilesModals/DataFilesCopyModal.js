import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalListingTable from './DataFilesModalTables/DataFilesModalListingTable';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';
import DataFilesSystemSelector from '../DataFilesSystemSelector/DataFilesSystemSelector';
import DataFilesProjectsList from '../DataFilesProjectsList/DataFilesProjectsList';

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
  const { showProjects } = useSelector(state => state.files.modalProps.copy);
  const status = useSelector(
    state => state.files.operationStatus.copy,
    shallowEqual
  );
  const [disabled, setDisabled] = useState(false);
  const systems = useSelector(
    state => state.systems.storage.configuration,
    shallowEqual
  );

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
    const systemParams = {
      api: 'tapis',
      scheme: 'private',
      system: systems[0].system
    };
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: {
        ...systemParams,
        section: 'modal'
      }
    });
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation: 'copy',
        props: {}
      }
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
      toggle();
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
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Copy
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
              <DataFilesModalSelectedTable data={selected} operation="copy" />
            </div>
          </div>
          <div className="col-md-6 d-flex flex-column">
            <div className="dataFilesModalColHeader">
              Destination
              <DataFilesSystemSelector
                operation="copy"
                systemId={(systems[0] || params).system}
                section="modal"
                disabled={disabled}
                showProjects={showProjects}
                excludedSystems={systems
                  .filter(s => s.scheme !== 'private')
                  .map(s => s.system)}
              />
            </div>
            {!showProjects && (
              <DataFilesBreadcrumbs
                api={modalParams.api}
                scheme={modalParams.scheme}
                system={modalParams.system}
                path={modalParams.path || '/'}
                section="modal"
              />
            )}
            <div className="filesListing">
              {showProjects ? (
                <DataFilesProjectsList modal="copy" />
              ) : (
                <DataFilesModalListingTable
                  data={files.filter(listingFilter)}
                  operationName="Copy"
                  operationCallback={copyCallback}
                  operationOnlyForFolders
                  operationAllowedOnRootFolder
                  disabled={disabled}
                />
              )}
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
});

export default DataFilesCopyModal;
