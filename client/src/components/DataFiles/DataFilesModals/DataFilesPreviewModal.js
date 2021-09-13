import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { LoadingSpinner, Message } from '_common';
import './DataFilesPreviewModal.module.scss';

const DataFilesPreviewModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.preview);
  const params = useSelector(state => state.files.modalProps.preview);
  const { href, content, error, isLoading } = useSelector(
    state => state.files.preview
  );
  const hasError = error !== null;
  const previewUsingTextContent = !isLoading && !hasError && content !== null;
  const previewUsingHref = !isLoading && !hasError && !previewUsingTextContent;
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'preview', props: {} }
    });

  const onOpen = () => {
    setIsFrameLoading(true);
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
      payload: { content: null, href: null, error: null, isLoading: true }
    });
  };

  const onFrameLoad = useCallback(() => {
    setIsFrameLoading(false);
  }, [setIsFrameLoading]);

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      onOpened={onOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        File Preview: {params.name}
      </ModalHeader>
      <ModalBody styleName="root">
        {(isLoading || (previewUsingHref && isFrameLoading)) && (
          <div class = "loading-style">
          <LoadingSpinner /> </div>
        )}
        {previewUsingTextContent && (
          <div>
            <code>
              <pre styleName="text-preview">{content}</pre>
            </code>
          </div>
        )}
        {previewUsingHref && (
          <div className="embed-responsive embed-responsive-4by3">
            <iframe
              title="preview"
              frameBorder="0"
              className="embed-responsive-item"
              onLoad={onFrameLoad}
              src={href}
            />
          </div>
        )}
        {hasError && (
          <Message type="warning" styleName="error">
            {error}
          </Message>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DataFilesPreviewModal;
