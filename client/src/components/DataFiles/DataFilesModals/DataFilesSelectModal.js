import React, { useEffect } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesModalListingTable from './DataFilesModalTables/DataFilesModalListingTable';
import DataFilesSystemSelector from '../DataFilesSystemSelector/DataFilesSystemSelector';

const DataFilesSelectModal = ({ isOpen, toggle, onSelect }) => {
  const systems = useSelector(state => state.systems, shallowEqual);
  const files = useSelector(state => state.files.listing.modal, shallowEqual);
  const dispatch = useDispatch();
  const modalParams = useSelector(
    state => state.files.params.modal,
    shallowEqual
  );
  const onOpened = () => {
    const systemParams = {
      api: 'tapis',
      scheme: 'private',
      system: systems.private
    };
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...systemParams, section: 'modal' }
    });
  };

  const selectCallback = (system, path) => {
    onSelect(system, path);
    toggle();
  };

  useEffect(() => {
    dispatch({ type: 'FETCH_SYSTEMS' });
  }, [dispatch]);
  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      toggle={toggle}
      size="xl"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Select</ModalHeader>
      <ModalBody style={{ height: '70vh' }}>
        <div className="row h-100">
          <div className="col-md-12 d-flex flex-column">
            <div className="dataFilesModalColHeader">
              Select Input
              <DataFilesSystemSelector
                systemId={modalParams.system}
                section="modal"
              />
            </div>
            <DataFilesBreadcrumbs
              api={modalParams.api}
              scheme={modalParams.scheme}
              system={modalParams.system}
              path={modalParams.path || '/'}
              section="modal"
              systemSelector
            />
            <div className="filesListing">
              <DataFilesModalListingTable
                data={files}
                operationName="Select"
                operationCallback={selectCallback}
              />
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
  onSelect: PropTypes.func.isRequired
};

export default DataFilesSelectModal;
