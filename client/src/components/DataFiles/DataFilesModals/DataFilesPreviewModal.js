import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { LoadingSpinner } from '_common';

const PreviewModalSpinner = () => (
  <div className="h-100 listing-placeholder">
    <LoadingSpinner />
  </div>
);

const DataFilesPreviewModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.preview);
  const params = useSelector(state => state.files.modalProps.preview);
  const previewHref = useSelector(state => state.files.previewHref);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'preview', props: {} }
    });

  const onOpen = () => {
    setLoadingPreview(true);

    dispatch({
      type: 'DATA_FILES_PREVIEW',
      payload: {
        api: params.api,
        scheme: params.scheme,
        system: params.system,
        path: params.path,
        href: params.href
      }
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_SET_PREVIEW_HREF', payload: { href: '' } });
  };

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        onOpened={onOpen}
        onClosed={onClosed}
        toggle={toggle}
        className="dataFilesModal"
      >
        <ModalHeader toggle={toggle}>File Preview: {params.name}</ModalHeader>
        <ModalBody>
          {loadingPreview && <PreviewModalSpinner />}
          {previewHref && (
            <div className="embed-responsive embed-responsive-4by3">
              <iframe
                title="preview"
                frameBorder="0"
                className="embed-responsive-item"
                src={previewHref}
                onLoad={() => setLoadingPreview(false)}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary"
            className="data-files-btn-cancel"
            onClick={toggle}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DataFilesPreviewModal;
