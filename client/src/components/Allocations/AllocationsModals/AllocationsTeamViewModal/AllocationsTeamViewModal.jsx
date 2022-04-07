import React, { useState } from 'react';
import { number, bool, func } from 'prop-types';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Container,
  Col,
  Row,
  Button,
} from 'reactstrap';
import { useSelector } from 'react-redux';
import { LoadingSpinner } from '_common';
import { has } from 'lodash';
import AllocationsTeamTable from './AllocationsTeamTable';
import AllocationsContactCard from './AllocationsContactCard';
import styles from './AllocationsTeamViewModal.module.scss';

const AllocationsTeamViewModal = ({
  isOpen,
  toggle,
  projectId,
  managementToggle,
}) => {
  const { teams, loadingUsernames, errors } = useSelector(
    (state) => state.allocations
  );
  const user = useSelector((state) => state.profile.data.demographics.username);
  const error = has(errors.teams, projectId);
  const [card, setCard] = useState(null);
  const [isManager, setManager] = useState(false);
  const isLoading =
    loadingUsernames[projectId] && loadingUsernames[projectId].loading;
  React.useEffect(() => {
    if (!isLoading) {
      const currentUser = teams[projectId].filter((u) => u.username === user);
      if (currentUser.length !== 1) return;
      if (currentUser[0].role === 'PI' || currentUser[0].role === 'Delegate')
        setManager(true);
    }
  }, [isLoading]);

  const resetCard = () => {
    setCard(null);
  };
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      className={styles.root}
      size="lg"
      onClosed={resetCard}
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        <span>View Team</span>
        <div>
          {isManager && (
            <Button
              className="btn btn-sm p-0"
              color="link"
              onClick={managementToggle}
            >
              Manage Team
            </Button>
          )}
        </div>
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
              <Col className={styles['listing-wrapper']} lg={5}>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <AllocationsTeamTable
                    visible={card}
                    rawData={teams[projectId]}
                    clickHandler={setCard}
                  />
                )}
              </Col>
              <Col className={styles['information-wrapper']}>
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
  projectId: number.isRequired,
};

export default AllocationsTeamViewModal;
