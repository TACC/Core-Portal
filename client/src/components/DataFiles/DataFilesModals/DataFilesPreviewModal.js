import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

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
  return (
    <>
      <Modal size="lg" isOpen={isOpen} onOpened={onOpen} toggle={toggle}>
        <ModalHeader toggle={toggle}>File Preview: {params.name}</ModalHeader>
        <ModalBody>
          {loadingPreview && 'Loading...'}
          <div className="embed-responsive embed-responsive-4by3">
            {previewHref && (
              <iframe
                title="preview"
                frameBorder="0"
                className="embed-responsive-item"
                src={previewHref}
                onLoad={() => setLoadingPreview(false)}
              />
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DataFilesPreviewModal;
