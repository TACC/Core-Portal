import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const DataFilesCompressModal = () => {
  const [disabled, setDisabled] = useState(false);
  const dispatch = useDispatch();

  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const modalParams = useSelector(
    state => state.files.params.modal,
    shallowEqual
  );
  const isOpen = useSelector(state => state.files.modals.compress);
  const selectedFiles = useSelector(({ files: { selected, listing } }) =>
    selected.FilesListing.map(i => ({
      ...listing.FilesListing[i]
    }))
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'compress', props: {} }
    });

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' }
    });
    // TODO: Get Zippy!
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    setDisabled(false);
  };

  const compressCallback = () => {
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload: { files: selected }
    });
  };

  if (isOpen) console.log(selected, modalParams);
  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Compressing</ModalHeader>
      <ModalBody />
      <ModalFooter>
        <Button onClick={compressCallback} className="data-files-btn">
          Compress
        </Button>
        <Button
          color="secondary"
          className="data-files-btn-cancel"
          onClick={toggle}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesCompressModal;
