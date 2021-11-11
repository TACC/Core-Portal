import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { SectionMessage } from '_common';
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
  const { showProjects, canMakePublic } = useSelector(
    state => state.files.modalProps.copy
  );
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
  };

  const excludedSystems = systems
    .filter(s => s.scheme !== 'private')
    .filter(s => !(s.scheme === 'public' && canMakePublic))
    .map(s => s.system);

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { operation: 'copy', status: {} }
    });
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation: 'copy',
        props: {}
      }
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

  const actionString = `${
    params.system === modalParams.system ? 'Copying' : 'Start Copying'
  } ${selected.length} File${selected.length > 1 ? 's' : ''}`;

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
              operation="copy"
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
                excludedSystems={excludedSystems}
              />
            </div>
            {!showProjects && (
              <DataFilesBreadcrumbs
                api={modalParams.api}
                scheme={modalParams.scheme}
                system={modalParams.system}
                path={modalParams.path || '/'}
                operation="copy"
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
      <div>
        {modalParams.scheme === 'public' && (
          <ModalFooter className="d-flex justify-content-start">
            <SectionMessage type="warning">
              Files copied to Public Data will be avaliable to general public.{' '}
              <b>This action cannot be reversed.</b>
            </SectionMessage>
          </ModalFooter>
        )}
      </div>
    </Modal>
  );
});

export default DataFilesCopyModal;
