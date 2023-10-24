import React from 'react';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { bool, func, string } from 'prop-types';
import './JobsSessionModal.global.scss';
import styles from './JobsSessionModal.module.scss';

const JobsSessionModal = ({
  isOpen,
  toggle,
  interactiveSessionLink,
  message,
}) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} contentClassName="session-modal">
      <ModalHeader
        className={styles['session-modal-header']}
        toggle={toggle}
        charCode="&#xe912;"
      >
        Open Session
      </ModalHeader>
      <ModalBody className={styles['session-modal-body']}>
        <span>
          Click the button below to connect to the interactive session.
        </span>
        {message && <b>{message}</b>}
        <span>To end the job, quit the application within the session.</span>
        <span>
          Files may take some time to appear in the output location after the
          job has ended.
        </span>
        <Button
          className={styles['connect-button']}
          href={interactiveSessionLink}
          target="_blank"
        >
          Connect
        </Button>
        <span className={styles.url}>
          For security purposes, this is the URL that the connect button will
          open:
        </span>
        <span className={styles.url}>{interactiveSessionLink}</span>
      </ModalBody>
    </Modal>
  );
};
JobsSessionModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired,
  interactiveSessionLink: string.isRequired,
};
export default JobsSessionModal;
