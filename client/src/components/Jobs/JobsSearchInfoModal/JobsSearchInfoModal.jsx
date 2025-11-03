import React from 'react';
import { bool, func } from 'prop-types';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

const JobsSearchInfoModal = ({ isOpen, toggle }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Search Tips
      </ModalHeader>
      <ModalBody>
        <ul>
          <li>
            Search is case-sensitive, meaning it looks for names that match
            exactly how they&apos;re written.
          </li>
          <li>
            Typing testfile won&apos;t find TeStFiLe, but will match if you use
            the same mix of letters.
          </li>
          <li>
            We check for lowercase, UPPERCASE, and Title Case versions
            automatically - but unusual names like TeStFiLe might not show up
            unless typed the same way.
          </li>
          <li>
            Tip: If you&apos;re not sure, try typing a smaller part of the name
            that you know for sure
          </li>
          <li>
            You can also search by job status (Finished, Running, Failed, etc.)
          </li>
        </ul>
      </ModalBody>
    </Modal>
  );
};

JobsSearchInfoModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired,
};

export default JobsSearchInfoModal;
