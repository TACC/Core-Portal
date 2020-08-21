import React from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { bool, func, string } from 'prop-types';
import './JobsSessionModal.global.scss';
import './JobsSessionModal.module.scss';

const JobsSessionModal = ({ isOpen, toggle, interactiveSessionLink }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} contentClassName="session-modal">
      <ModalHeader styleName="session-modal-header" toggle={toggle}>
        Open Session
      </ModalHeader>
      <ModalBody styleName="session-modal-body">
        <span>
          Click the button below to connect to the interactive session.
        </span>
        <span>To end the job, quit the application within the session.</span>
        <span>
          Files may take some time to appear in the output location after the
          job has ended.
        </span>
        <Button
          styleName="connect-button"
          href={interactiveSessionLink}
          target="_blank"
        >
          Connect
        </Button>
        <span styleName="url">
          For security purposes, this is the URL that the connect button will
          open:
        </span>
        <span styleName="url">{interactiveSessionLink}</span>
      </ModalBody>
    </Modal>
  );
};
JobsSessionModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired,
  interactiveSessionLink: string.isRequired
};
export default JobsSessionModal;
