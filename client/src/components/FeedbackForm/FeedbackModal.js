import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { func, bool } from 'prop-types';
import { Link } from 'react-router-dom';
import FeedbackForm from './FeedbackForm';
import * as ROUTES from '../../constants/routes';
import './FeedbackModal.module.scss';

const MODAL_PROPTYPES = {
  isOpen: bool.isRequired,
  toggle: func.isRequired
};

const FeedbackModal = React.memo(({ isOpen, toggle }) => {
  return (
    <Modal styleName="container" isOpen={isOpen} toggle={() => toggle()}>
      <ModalHeader styleName="header" toggle={toggle} charCode="x">
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
          <Link to={`${ROUTES.USER_GUIDE}`}>user guide</Link>, or{' '}
          <Link
            onClick={() => toggle()}
            to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
          >
            submit a ticket.
          </Link>
        </p>
        <FeedbackForm />
      </ModalBody>
    </Modal>
  );
});

FeedbackModal.propTypes = MODAL_PROPTYPES;

export default FeedbackModal;
