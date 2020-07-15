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
          We want to hear your feedback about Frontera! If you have any
          comments, suggestions, or feature requests, please use the form below
          to let us know.
        </p>
        <p>
          If you're looking to learn more about Frontera, please have a look
          through our <Link
            to={`userGuideURL`}
            className="wb-link job__path"
          >
            User Guide
          </Link> where many of your questions may have already
          been answered.
        </p>
        <FeedbackForm authenticatedUser={authenticatedUser} />
      </ModalBody>


      <ModalFooter>
        <Button className="data-files-btn" onClick={sendEmail}>
          Submit
        </Button>{' '}
        <Button
          color="secondary"
          onClick={toggle}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
});

FeedbackModal.propTypes = MODAL_PROPTYPES;

export default FeedbackModal;
