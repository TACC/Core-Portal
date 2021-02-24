import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import PropTypes from 'prop-types';
import { onboardingUserPropType, stepPropType } from './OnboardingPropTypes';

const OnboardingEventLogModal = ({ toggle, params }) => {
  return (
    <Modal isOpen={params} toggle={toggle}>
      <ModalHeader toggle={toggle}>View Log</ModalHeader>
      <ModalBody>
        <div>{`${params.user.firstName} ${params.user.lastName}`}</div>
        <div>{`${params.step.displayName}`}</div>
      </ModalBody>
    </Modal>
  );
};

OnboardingEventLogModal.propTypes = {
  toggle: PropTypes.func.isRequired,
  params: PropTypes.shape({
    user: onboardingUserPropType,
    step: stepPropType
  }).isRequired
};

export default OnboardingEventLogModal;
