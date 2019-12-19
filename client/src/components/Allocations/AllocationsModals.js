import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalHeader as Header,
  ModalBody as Body,
  Table
} from 'reactstrap';

const modalPropTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired
};

export const NewAllocReq = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={() => toggle()}>
    <Header toggle={toggle} charCode="X">
      <span>Request New Allocation</span>
    </Header>
    <Body>Request New Allocation Form</Body>
  </Modal>
);
NewAllocReq.propTypes = modalPropTypes;

export const TeamView = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={toggle}>
    <Header toggle={toggle} charCode="X">
      Team View
    </Header>
    <Body>
      <Table striped>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Usage</th>
          </tr>
        </thead>
        <tbody />
      </Table>
    </Body>
  </Modal>
);
TeamView.propTypes = modalPropTypes;
