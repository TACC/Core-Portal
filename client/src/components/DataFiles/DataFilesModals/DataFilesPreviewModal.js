import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { LoadingSpinner } from '_common';
import './DataFilesPreviewModal.module.scss';

const PreviewModalSpinner = () => (
  <div className="h-100 listing-placeholder">
    <LoadingSpinner />
  </div>
);

const DataFilesPreviewModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.preview);
  const params = useSelector(state => state.files.modalProps.preview);
  const previewHref = useSelector(state => state.files.preview.href);
  const previewContent = useSelector(state => state.files.preview.content);
  const isLoading = useSelector(state => state.files.preview.isLoading);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'preview', props: {} }
    });

  const onOpen = () => {
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
    dispatch({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: { content: '', href: '', isLoading: true }
    });
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
          {isLoading && <PreviewModalSpinner />}
          {previewContent ? (
            <div>
              <code>
                <pre styleName="text-preview">{previewContent}</pre>
              </code>
            </div>
          ) : (
            <div className="embed-responsive embed-responsive-4by3">
              <iframe
                title="preview"
                frameBorder="0"
                className="embed-responsive-item"
                src={previewHref}
              />
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesPreviewModal;
