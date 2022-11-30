import React from 'react';
import { func, bool } from 'prop-types';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './AllocationsRequestModal.module.scss';

export const AllocationsRequestModal = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={toggle}>
    <ModalHeader
      toggle={toggle}
      charCode="&#xe912;"
      className="allocations-modal-header"
    >
      <span>Manage Allocations</span>
    </ModalHeader>
    <ModalBody className={styles['modal-body']}>
      <p>
        <strong>For Frontera:</strong> You can manage your
        allocation or request more time on a machine by using your TACC user
        account credentials to access the Resource Allocation System at&nbsp;
        <a
          href="https://submit-tacc.xras.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          https://submit-tacc.xras.org/
        </a>
        .
      </p>
      <p>
        <strong>For Stampede2, Corral, or Others:</strong> You can manage your
        allocation or request more time on a machine by using your TACC user
        account credentials to access your Allocations at&nbsp;
        <a
          href="https://portal.tacc.utexas.edu/projects-and-allocations"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          https://portal.tacc.utexas.edu/projects-and-allocations
        </a>
        .
      </p>
    </ModalBody>
  </Modal>
);
AllocationsRequestModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired,
};

export default AllocationsRequestModal;
