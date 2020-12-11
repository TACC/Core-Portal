import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label
} from 'reactstrap';
import PropTypes from 'prop-types';
import { LoadingSpinner, Message, TextCopyField } from '_common';
import './DataFilesLinkModal.module.scss';

const statusPropType = PropTypes.shape({
  error: PropTypes.string,
  url: PropTypes.string,
  method: PropTypes.string
});

const filePropType = PropTypes.shape({
  system: PropTypes.string,
  path: PropTypes.string
});

const DataFilesLinkAction = ({ scheme, file, text, status, method }) => {
  const dispatch = useDispatch();
  const onClick = event => {
    dispatch({
      type: 'DATA_FILES_LINK',
      payload: {
        file,
        scheme,
        method
      }
    });
    event.preventDefault();
  };

  return (
    <Button
      type="submit"
      disabled={status && status.method != null}
      className="data-files-btn"
      onClick={event => onClick(event)}
      styleName="action-root"
    >
      {status && status.method === method ? (
        <>
          <LoadingSpinner placement="inline" />{' '}
        </>
      ) : null}
      {text}
    </Button>
  );
};

DataFilesLinkAction.propTypes = {
  scheme: PropTypes.string.isRequired,
  file: filePropType.isRequired,
  text: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  status: statusPropType
};

DataFilesLinkAction.defaultProps = {
  status: {
    error: null,
    url: '',
    method: null
  }
};

const DataFilesLinkStatus = ({ scheme, file, status }) => {
  if (!status) {
    return null;
  }
  if (status && status.error) {
    // Error occurred during retrieval of link
    return (
      <Message type="error">
        There was a problem retrieving the link for this file.
      </Message>
    );
  }
  return (
    <FormGroup>
      <Label>
        Link
        {status && status.method === 'get' ? (
          <LoadingSpinner placement="inline" />
        ) : null}
      </Label>
      <TextCopyField
        placeholder="Click generate to make a link"
        value={status.url}
      />
      <div styleName="controls">
        {status && status.url ? (
          <DataFilesLinkAction
            scheme={scheme}
            file={file}
            text="Delete"
            status={status}
            method="delete"
          />
        ) : null}
        <DataFilesLinkAction
          scheme={scheme}
          file={file}
          text={status && status.url ? 'Replace Link' : 'Generate Link'}
          status={status}
          method="post"
        />
      </div>
    </FormGroup>
  );
};

DataFilesLinkStatus.propTypes = {
  scheme: PropTypes.string.isRequired,
  file: filePropType.isRequired,
  status: statusPropType
};

DataFilesLinkStatus.defaultProps = {
  status: null
};

const DataFilesLinkModal = () => {
  const isOpen = useSelector(state => state.files.modals.link);
  const status = useSelector(state => state.files.operationStatus.link);
  const { scheme } = useSelector(state => state.files.params.FilesListing);
  const selectedFile = useSelector(state => {
    if (!state.files.modalProps.link) {
      return {};
    }
    return state.files.modalProps.link.selectedFile || {};
  });

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'link', props: {} }
    });
  };

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'link' }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <Form>
        <ModalHeader toggle={toggle}>Link for {selectedFile.name}</ModalHeader>
        <ModalBody>
          <DataFilesLinkStatus
            scheme={scheme}
            file={selectedFile}
            status={status}
          />
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
      </Form>
    </Modal>
  );
};

export default DataFilesLinkModal;
