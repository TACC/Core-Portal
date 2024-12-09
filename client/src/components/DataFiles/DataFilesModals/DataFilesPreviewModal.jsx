import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { LoadingSpinner, SectionMessage } from '_common';
import styles from './DataFilesPreviewModal.module.scss';
import { Niivue } from '@niivue/niivue';

const NiiVue = ({ imageUrl, fileName }) => {
  const canvas = useRef();
  useEffect(() => {
    const volumeList = [
      {
        url: imageUrl,
        name: fileName,
      },
    ];
    const nv = new Niivue();
    nv.attachToCanvas(canvas.current);
    nv.loadVolumes(volumeList);
  }, [imageUrl]);

  return <canvas ref={canvas} height={480} width={640} />;
};

const DataFilesPreviewModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.files.modals.preview);
  const params = useSelector((state) => state.files.modalProps.preview);
  const { href, content, error, fileType, isLoading } = useSelector(
    (state) => state.files.preview
  );
  const hasError = error !== null;
  const previewUsingTextContent = !isLoading && !hasError && content !== null;
  const previewUsingHref = !isLoading && !hasError && !previewUsingTextContent;
  const previewUsingBrainmap =
    !isLoading && !hasError && params.path && fileType == 'brainmap';
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  useEffect(() => {
    if (previewUsingBrainmap) setIsFrameLoading(false);
  }, [previewUsingBrainmap]);

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'preview', props: {} },
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
        length: params.length,
      },
    });
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_PREVIEW_CONTENT',
      payload: { content: null, href: null, error: null, isLoading: true },
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
      <ModalBody className={styles.root}>
        {(isLoading || (previewUsingHref && isFrameLoading)) && (
          <div className={styles['loading-style']}>
            <LoadingSpinner />
          </div>
        )}
        {previewUsingTextContent && (
          <div>
            <code>
              <pre className={styles['text-preview']}>{content}</pre>
            </code>
          </div>
        )}
        {previewUsingBrainmap && (
          <NiiVue imageUrl={href} fileName={params.path}></NiiVue>
        )}
        {previewUsingHref && !previewUsingBrainmap && (
          <div className="ratio ratio-4x3">
            <iframe
              title="preview"
              frameBorder="0"
              onLoad={onFrameLoad}
              src={href}
            />
          </div>
        )}
        {hasError && (
          <div className={styles.error}>
            <SectionMessage type="warning" className={styles['error-message']}>
              {error}
            </SectionMessage>
            <Button
              className={styles.button}
              href={href}
              target={fileType === 'other' ? '' : '_blank'}
            >
              <i className="icon-exit" />
              <span className="toolbar-button-text">Download File</span>
            </Button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default DataFilesPreviewModal;
