import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { bool, func } from 'prop-types';
import { Modal, ModalHeader, ModalBody, Container, Col, Row } from 'reactstrap';
import { Tab, Tabs } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { InlineMessage, LoadingSpinner } from '_common';
import { has } from 'lodash';
import AllocationsTeamTable from './AllocationsTeamTable';
import AllocationsManageTeamTable from '../AllocationsManageTeamTable';
import AllocationsContactCard from './AllocationsContactCard';
import { UserSearchbar } from '_common';
import styles from './AllocationsTeamViewModal.module.scss';
import manageStyles from '../AllocationsManageTeamTable/AllocationsManageTeamTable.module.scss';

const AllocationsTeamViewModal = ({ isOpen, toggle }) => {
  const { projectId: projectIdString } = useParams();
  const projectId = Number(projectIdString);
  const {
    teams,
    loadingUsernames,
    search,
    errors,
    addUserOperation,
    removingUserOperation,
  } = useSelector((state) => state.allocations);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.authenticatedUser.user.username);
  const error = has(errors.teams, projectId);
  const [card, setCard] = useState(null);
  const [isManager, setManager] = useState(false);
  const isLoading =
    loadingUsernames[projectId] && loadingUsernames[projectId].loading;
  React.useEffect(() => {
    if (!isLoading && projectId in teams) {
      const currentUser = teams[projectId].filter((u) => u.username === user);
      if (currentUser.length !== 1) return;
      if (currentUser[0].role === 'PI' || currentUser[0].role === 'Delegate')
        setManager(true);
    }
  }, [isLoading]);

  const resetCard = () => {
    setCard(null);
  };

  useEffect(() => {
    dispatch({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_INIT',
    });
    dispatch({
      type: 'GET_PROJECT_USERS',
      payload: { projectId },
    });
  }, [isOpen]);

  const onAdd = useCallback(
    (newUser) => {
      dispatch({
        type: 'ADD_USER_TO_TAS_PROJECT',
        payload: {
          projectId,
          username: newUser.user.username,
        },
      });
    },
    [projectId, dispatch]
  );

  const onChange = useCallback(
    (query) => {
      dispatch({
        type: 'GET_USERS_FROM_SEARCH',
        payload: {
          term: query,
        },
      });
    },
    [dispatch]
  );

  const [selectedTab, setSelectedTab] = useState(0);
  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
  };

  let selectedUser = null;
  if (removingUserOperation && removingUserOperation.username) {
    selectedUser = removingUserOperation.username;
  }
  if (card && card.username === selectedUser) {
    setCard(null);
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" onClosed={resetCard}>
      <ModalHeader className="has-MuiTabs" toggle={toggle} charCode="&#xe912;">
        <Tabs
          style={{ marginBottom: '-8px' }}
          value={selectedTab}
          onChange={handleTabChange}
        >
          <Tab style={{ width: '160px', color: '#222222' }} label="View Team" />
          {isManager && <Tab label="Manage Team" />}
        </Tabs>
      </ModalHeader>
      <ModalBody className={selectedTab === 0 ? 'd-flex p-0' : 'pb-0'}>
        {selectedTab === 0 && (
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
        )}
        {selectedTab === 1 && (
          <>
            <div className={manageStyles['search-bar-wrapper']}>
              <span className={manageStyles['search-bar-header-text']}>
                Add Member
              </span>
              <UserSearchbar
                members={teams[projectId]}
                onAdd={onAdd}
                isLoading={addUserOperation.loading}
                onChange={onChange}
                searchResults={search.results}
                placeholder=""
              />
              <small className={manageStyles['help-text']}>
                Search by entering the full username, email, or last name.
              </small>
            </div>
            <div className={manageStyles['listing-wrapper']}>
              {error ? (
                <Row style={{ height: '50vh' }}>
                  <Col className="d-flex justify-content-center">
                    <span>Unable to retrieve team data.</span>
                  </Col>
                </Row>
              ) : isLoading ? (
                <LoadingSpinner />
              ) : (
                <AllocationsManageTeamTable
                  rawData={teams[projectId]}
                  projectId={projectId}
                />
              )}
            </div>
            <div className={manageStyles['user-operation-error']}>
              {addUserOperation.error ? (
                <InlineMessage type="error">
                  Unable to add user {addUserOperation.username}.
                </InlineMessage>
              ) : null}
              {addUserOperation.error && removingUserOperation.error ? (
                <br></br>
              ) : null}
              {removingUserOperation.error ? (
                <InlineMessage type="error">
                  Unable to remove user {removingUserOperation.username}.
                </InlineMessage>
              ) : null}
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
};
AllocationsTeamViewModal.propTypes = {
  isOpen: bool.isRequired,
  toggle: func.isRequired,
};

export default AllocationsTeamViewModal;
