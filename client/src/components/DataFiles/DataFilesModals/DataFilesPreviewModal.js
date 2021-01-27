import React, { useState, useCallback, useEffect } from 'react';
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
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  /* 
    Force effect on every modal load

    params as a dependency means that when the object identify
    changes open modal open, this effect will be re-run
  */
  useEffect(() => {
    setIsFrameLoading(true);
  }, [setIsFrameLoading, params]);

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
        href: params.href,
        length: params.length
      }
    });
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: { content: '', href: '', isLoading: true }
    });
  };

  const onFrameLoad = useCallback(() => {
    setIsFrameLoading(false);
  }, [setIsFrameLoading]);

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
          {(isLoading || (!previewContent && isFrameLoading)) && (
            <PreviewModalSpinner />
          )}
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
                onLoad={onFrameLoad}
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
