import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { LoadingSpinner } from '_common';
import { func } from 'prop-types';

const PreviewModalSpinner = () => (
  <div className="h-100 listing-placeholder">
    <LoadingSpinner />
  </div>
);

const TextPreview = ({ cb }) => {
  const body = useSelector(state => state.files.previewText);
  useEffect(() => {
    if (body) cb();
  }, [body]);
  return (
    <div>
      <pre>
        <code>{body}</code>
      </pre>
    </div>
  );
};
TextPreview.propTypes = {
  cb: func.isRequired
};

const DataFilesPreviewModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.preview);
  const params = useSelector(state => state.files.modalProps.preview);
  const previewHref = useSelector(state => state.files.previewHref);
  const previewType = useSelector(state => state.files.previewType);
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
    dispatch({
      type: 'DATA_FILES_SET_PREVIEW_HREF',
      payload: { href: '', other: false, previewText: '' }
    });
  };

  const renderPreview = type => {
    switch (type) {
      case 'other':
        return 'Preview not available for this item.';
      case 'text':
        return <TextPreview cb={() => setLoadingPreview(false)} />;
      default:
        return (
          <div className="embed-responsive embed-responsive-4by3">
            <iframe
              title="preview"
              frameBorder="0"
              className="embed-responsive-item"
              src={previewHref}
              onLoad={() => setLoadingPreview(false)}
            />
          </div>
        );
    }
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
          {previewHref && renderPreview(previewType)}
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
