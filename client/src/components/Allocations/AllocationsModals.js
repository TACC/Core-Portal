import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalHeader as Header,
  ModalBody as Body,
  Table
} from 'reactstrap';
import { Link } from 'react-router-dom';

const modalPropTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired
};

export const NewAllocReq = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={() => toggle()}>
    <Header toggle={toggle} charCode="x" className="allocations-modal-header">
      <span>Request New Allocation</span>
    </Header>
    <Body className="allocations-request-body" data-testid="request-body">
      To request a new allocation, please submit a ticket{' '}
      <Link to="/workbench/dashboard">here</Link>.
    </Body>
  </Modal>
);
NewAllocReq.propTypes = modalPropTypes;

export const TeamView = ({ isOpen, toggle }) => (
  <Modal isOpen={isOpen} toggle={toggle}>
    <Header toggle={toggle} charCode="x" className="allocations-modal-header">
      <span>Team View</span>
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
