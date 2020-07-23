import React from 'react';
import { Modal, ModalHeader, ModalFooter, ModalBody, Button } from 'reactstrap';
import { func, bool } from 'prop-types';
import { Link } from 'react-router-dom';
import FeedbackForm from './FeedbackForm';
import './FeedbackModal.scss';

const MODAL_PROPTYPES = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};

const sendEmail = () => {
  // TODO: Sending emails
};

const FeedbackModal = React.memo(({ isOpen, toggle, authenticatedUser }) => {
  return (
    <Modal isOpen={isOpen} toggle={() => toggle()}>
      <ModalHeader toggle={toggle} charCode="x">
        Feedback
      </ModalHeader>
      <ModalBody>
        <p>
          User feedback helps to improve the website. If you have suggestions,
          feature requests, or comments (negative or positive), submit this form
          and they will be taken into consideration.
        </p>
        <p>
          If you need assistance, refer to the{' '}
          <Link to="userGuideURL" className="wb-link job__path">
            User Guide
          </Link>
          , or{' '}
          <Link to="userGuideURL" className="wb-link job__path">
            submit a ticket.
          </Link>
        </p>
        <FeedbackForm authenticatedUser={authenticatedUser} />
      </ModalBody>

      <ModalFooter>
        <Button className="data-files-btn" onClick={sendEmail}>
          Submit
        </Button>
      </ModalFooter>
    </Modal>
  );
});

FeedbackModal.propTypes = MODAL_PROPTYPES;

export default FeedbackModal;
