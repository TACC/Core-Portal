import React, { useState } from 'react';
import { number, bool, func } from 'prop-types';
import { Modal, ModalHeader, ModalBody, Container, Col, Row } from 'reactstrap';
import { useSelector } from 'react-redux';
import { LoadingSpinner } from '_common';
import { has } from 'lodash';
import AllocationsTeamTable from './AllocationsTeamTable';
import AllocationsContactCard from './AllocationsContactCard';
import './AllocationsTeamViewModal.module.scss';

const AllocationsTeamViewModal = ({ isOpen, toggle, pid }) => {
  const { teams, loadingUsernames, errors } = useSelector(
    state => state.allocations
  );
  const error = has(errors.teams, pid);
  const [card, setCard] = useState(null);
  const isLoading = loadingUsernames[pid] && loadingUsernames[pid].loading;
  const resetCard = () => {
    setCard(null);
  };
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      styleName="root"
      size="lg"
      onClosed={resetCard}
    >
      <ModalHeader
        toggle={toggle}
        charCode="&#xe912;"
        className="allocations-modal-header"
      >
        <span>View Team</span>
      </ModalHeader>
      <ModalBody className="d-flex p-0">
        <Container>
          {error ? (
            <Row style={{ height: '50vh' }}>
              <Col className="d-flex justify-content-center">
                <span>Unable to retrieve team data.</span>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col styleName="listing-wrapper" lg={5}>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <AllocationsTeamTable
                    visible={card}
                    rawData={teams[pid]}
                    clickHandler={setCard}
                  />
                )}
              </Col>
              <Col styleName="information-wrapper">
                {isLoading ? (
                  <span>Loading user list. This may take a moment.</span>
                ) : (
                  <AllocationsContactCard listing={card} />
                )}
              </Col>
            </Row>
          )}
        </Container>
      </ModalBody>
    </Modal>
  );
};
AllocationsTeamViewModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired,
  pid: number.isRequired
};

export default AllocationsTeamViewModal;
