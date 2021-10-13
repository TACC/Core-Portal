import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { LoadingSpinner, SectionMessage } from '_common';
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
        href: params.href,
        length: params.length
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
          <div styleName="loading-style">
            <LoadingSpinner />
          </div>
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
          <div styleName="error">
            <SectionMessage type="warning" styleName="error-message">
              {error}
            </SectionMessage>
            <Button styleName="button" href={href} target="_blank">
              <i className="icon-exit" />
              <span className="toolbar-button-text">Preview File</span>
            </Button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DataFilesPreviewModal;
