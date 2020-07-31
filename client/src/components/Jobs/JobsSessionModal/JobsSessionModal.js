import React from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { bool, func } from 'prop-types';
import './JobsSessionModal.global.scss';
import './JobsSessionModal.module.scss';

const JobsSessionModal = ({ isOpen, toggle }) => {
  const dispatch = useDispatch();
  const onClose = () => {
    dispatch({ type: 'GET_JOBS', params: { offset: 0, limit: 20 } });
  };
  const url = 'https://google.com';
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      contentClassName="session-modal"
      onClosed={onClose}
    >
      <ModalHeader
        styleName="session-modal-header"
        charCode="X"
        toggle={toggle}
      >
        Open Session
      </ModalHeader>
      <ModalBody styleName="session-modal-body">
        <span>
          Click the button below to connect to the interactive session.
        </span>
        <span>To end the job, quit the application within the session </span>
        <span>
          Files may take some time to appear in the output location after the
          job has ended.
        </span>
        <Button styleName="connect-button">Connect</Button>
        <span>
          For security purposes, this is the URL that the connect button will
          open:
        </span>
        <span styleName="url">{url}</span>
      </ModalBody>
    </Modal>
  );
};
JobsSessionModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};
export default JobsSessionModal;
