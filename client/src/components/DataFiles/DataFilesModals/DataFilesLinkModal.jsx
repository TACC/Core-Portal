import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  FormText,
} from 'reactstrap';
import PropTypes from 'prop-types';
import { LoadingSpinner, Message, TextCopyField, InlineMessage } from '_common';
import styles from './DataFilesLinkModal.module.scss';
import './DataFilesLinkModal.scss';

const statusPropType = PropTypes.shape({
  error: PropTypes.string,
  url: PropTypes.string,
  method: PropTypes.string,
  loading: PropTypes.bool,
});

const DataFilesLinkActions = ({ status, onClick }) => {
  const disabled = status && status.method != null;

  if (status && status.url) {
    return (
      <>
        <Button
          disabled={disabled}
          className={`data-files-btn ${styles.action}`}
          onClick={(e) => onClick('delete')}
        >
          Delete
        </Button>
        <Button
          disabled={disabled}
          className="data-files-btn"
          onClick={(e) => onClick('put')}
        >
          Replace Link
        </Button>
      </>
    );
  }

  return (
    <Button
      disabled={disabled}
      className="data-files-btn"
      onClick={(e) => onClick('post')}
    >
      Generate Link
    </Button>
  );
};

DataFilesLinkActions.propTypes = {
  status: statusPropType,
  onClick: PropTypes.func.isRequired,
};

DataFilesLinkActions.defaultProps = {
  status: {
    error: null,
    url: '',
    method: null,
    loading: false,
  },
};

const DataFilesLinkStatus = ({ status }) => {
  if (!status) {
    return null;
  }
  if (status.loading) {
    return <LoadingSpinner placement="inline" />;
  }
  if (status.error) {
    // Error occurred during retrieval of link
    return (
      <Message type="error">
        There was a problem retrieving the link for this file.
      </Message>
    );
  }
  return (
    <FormGroup>
      <Label>Link</Label>
      <TextCopyField value={status.url} />
      <FormText className="form-field__help" color="muted">
        This link downloads the file without requiring login or an account.
      </FormText>
    </FormGroup>
  );
};

DataFilesLinkStatus.propTypes = {
  status: statusPropType,
};

DataFilesLinkStatus.defaultProps = {
  status: null,
};

const DataFilesLinkModal = () => {
  const isOpen = useSelector((state) => state.files.modals.link);
  const status = useSelector((state) => state.files.operationStatus.link);
  const { scheme } = useSelector((state) => state.files.params.FilesListing);
  const [confirming, setConfirming] = useState(false);
  const [method, setMethod] = useState('');
  const [message, setMessage] = useState(null);
  const file = useSelector((state) => {
    if (!state.files.modalProps.link) {
      return {};
    }
    return state.files.modalProps.link.selectedFile || {};
  });

  const dispatch = useDispatch();
  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'link', props: {} },
    });
    setMethod('');
    setMessage(null);
    setConfirming(false);
  }, [setMethod, setMessage, setConfirming]);

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'link' },
    });
  };

  const onCancel = useCallback(() => {
    setConfirming(false);
    setMethod(false);
  }, [setConfirming, setMethod]);

  const onConfirm = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_LINK',
      payload: { file, scheme, method },
    });
    setConfirming(false);
  }, [method, setConfirming, file, scheme]);

  const onActionClick = useCallback(
    (actionMethod) => {
      setMethod(actionMethod);
      switch (actionMethod) {
        case 'post':
        case 'put':
          setMessage('Link generated');
          break;
        case 'delete':
          setMessage('Link removed');
          break;
        default:
          setMessage(null);
      }
      if (actionMethod === 'post') {
        dispatch({
          type: 'DATA_FILES_LINK',
          payload: { file, scheme, method: 'post' },
        });
      } else {
        setConfirming(true);
      }
    },
    [setMethod, setConfirming, file, scheme, setMessage]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <Form>
        <ModalHeader toggle={toggle} charCode="&#xe912;">
          Link for {file.name}
        </ModalHeader>
        <ModalBody>
          <DataFilesLinkStatus scheme={scheme} file={file} status={status} />
        </ModalBody>
        <ModalFooter>
          {confirming ? (
            <>
              <span className={styles.warning}>
                The original link will be disabled.
              </span>
              <Button
                className="data-files-btn"
                color="secondary"
                onClick={onConfirm}
              >
                Confirm
              </Button>
              <Button color="link" onClick={onCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {status && !status.loading && !status.error && message ? (
                <InlineMessage type="success">{message}</InlineMessage>
              ) : null}
              <DataFilesLinkActions status={status} onClick={onActionClick} />
            </>
          )}
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default DataFilesLinkModal;
