import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { SectionMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import {
  useSelectedFiles,
  useFileListing,
  useSystems,
  useModal,
} from 'hooks/datafiles';
import { useCopy } from 'hooks/datafiles/mutations';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalListingTable from './DataFilesModalTables/DataFilesModalListingTable';
import DataFilesModalSelectedTable from './DataFilesModalTables/DataFilesModalSelectedTable';
import DataFilesSystemSelector from '../DataFilesSystemSelector/DataFilesSystemSelector';
import DataFilesProjectsList from '../DataFilesProjectsList/DataFilesProjectsList';

const DataFilesCopyModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();
  const { copy, setStatus } = useCopy();
  const { getStatus, getProps, setProps, toggle: toggleModal } = useModal();

  const { params } = useFileListing('FilesListing');
  const {
    params: modalParams,
    data: files,
    fetchListing,
  } = useFileListing('modal');

  const { data: systems } = useSystems();

  const dispatch = useDispatch();

  const reloadPage = () => {
    fetchListing(modalParams);
    history.push(location.pathname);
  };

  const isOpen = getStatus('copy');
  const { showProjects, canMakePublic } = getProps('copy');

  const [disabled, setDisabled] = useState(false);

  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);

  const toggle = () => toggleModal({ operation: 'copy', props: {} });

  const excludedSystems = systems
    .filter(
      (s) => s.hidden || (s.scheme !== 'private' && s.scheme !== 'projects')
    )
    .filter((s) => !(s.scheme === 'public' && canMakePublic))
    .map((s) => `${s.system}${s.homeDir || ''}`);

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    setStatus({});
    setProps({
      operation: 'copy',
      props: {},
    });
    setDisabled(false);
  };

  const copyCallback = useCallback(
    (system, path, name) => {
      setDisabled(true);
      copy({
        srcApi: params.api,
        destApi: modalParams.api,
        destSystem: system,
        destPath: path || '/',
        name,
        callback: reloadPage,
      });
    },
    [copy, reloadPage, setDisabled, params, modalParams]
  );

  const listingFilter = useCallback(
    ({ system, path, format }) => {
      return (
        format === 'folder' &&
        !(
          // Remove files from the listing if they have been selected.
          selectedFiles
            .map((f) => `${f.system}${f.path}`)
            .includes(`${system}${path}`)
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
                initialParams={params}
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
      {!showProjects && modalParams.scheme === 'public' && (
        <ModalFooter className="d-flex justify-content-start">
          <SectionMessage type="warning">
            Files copied to Public Data will be avaliable to general public.{' '}
            <b>This action cannot be reversed.</b>
          </SectionMessage>
        </ModalFooter>
      )}
    </Modal>
  );
});

export default DataFilesCopyModal;
