import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { shallowEqual, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalListingTable from './DataFilesModalTables/DataFilesModalListingTable';
import DataFilesSystemSelector from '../DataFilesSystemSelector/DataFilesSystemSelector';
import DataFilesProjectsList from '../DataFilesProjectsList/DataFilesProjectsList';
import DataFilesShowPathModal from './DataFilesShowPathModal';

const DataFilesSelectModal = ({ isOpen, toggle, onSelect }) => {
  const systems = useSelector(
    (state) => state.systems.storage.configuration,
    shallowEqual
  );
  const files = useSelector((state) => state.files.listing.modal, shallowEqual);
  const { showProjects } = useSelector(
    (state) => state.files.modalProps.select
  );

  const modalParams = useSelector(
    (state) => state.files.params.modal,
    shallowEqual
  );

  const selectRef = React.useRef();

  const selectCallback = (system, path) => {
    onSelect(system, path);
    toggle();
  };

  const excludedSystems = systems
    .filter((s) => s.api !== 'tapis' || s.hidden)
    .map((s) => `${s.system}${s.homeDir || ''}`);

  const selectedSystem =
    systems.filter((s) => s.api === 'tapis' && !s.hidden)[0] || modalParams;

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="xl"
      className="dataFilesModal"
      ref={selectRef}
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Select
      </ModalHeader>
      <ModalBody style={{ height: '70vh' }}>
        <div className="row h-100">
          <div className="col-md-12 d-flex flex-column">
            <div className="dataFilesModalColHeader">
              Select Input
              <DataFilesSystemSelector
                operation="select"
                defaultSystemAndHomeDirPath={`${selectedSystem?.system}${
                  selectedSystem?.homeDir || ''
                }`}
                section="modal"
                excludedSystems={excludedSystems}
                showProjects={showProjects}
              />
            </div>
            <div>
              {!showProjects && (
                <DataFilesBreadcrumbs
                  api={modalParams.api}
                  scheme={modalParams.scheme}
                  system={modalParams.system}
                  path={modalParams.path || '/'}
                  section="modal"
                />
              )}
            </div>
            <DataFilesShowPathModal />
            <div className="filesListing">
              {showProjects ? (
                <DataFilesProjectsList modal="select" />
              ) : (
                <DataFilesModalListingTable
                  data={files}
                  operationName="Select"
                  operationCallback={selectCallback}
                />
              )}
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

DataFilesSelectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default DataFilesSelectModal;
