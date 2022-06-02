import React, { useState, useEffect, useCallback } from 'react';
import { number, bool, func } from 'prop-types';
import { Modal, ModalHeader, ModalBody, Container, Col, Row } from 'reactstrap';
import { Tab, Tabs } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux';
import { LoadingSpinner } from '_common';
import { has } from 'lodash';
import AllocationsTeamTable from './AllocationsTeamTable';
import AllocationsManageTeamTable from '../AllocationsManageTeamTable';
import AllocationsContactCard from './AllocationsContactCard';
import { UserSearchbar } from '_common';
import styles from './AllocationsTeamViewModal.module.scss';
import manageStyles from '../AllocationsManageTeamTable/AllocationsManageTeamTable.module.scss';

const AllocationsTeamViewModal = ({
  isOpen,
  toggle,
  projectId,
  projectName,
}) => {
  const { teams, loadingUsernames, search, errors } = useSelector(
    (state) => state.allocations
  );
  const dispatch = useDispatch();
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

  useEffect(() => {
    dispatch({
      type: 'ALLOCATION_OPERATION_REMOVE_USER_INIT',
    });
  }, [isOpen]);

  const onAdd = useCallback(
    (newUser) => {
      dispatch({
        type: 'ADD_USER_TO_TAS_PROJECT',
        payload: {
          projectId,
          id: newUser.user.username,
          projectName,
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
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="lg"
      onClosed={resetCard}
    >
      <ModalHeader className="has-MuiTabs" toggle={toggle} charCode="&#xe912;">
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="View Team" />
          {isManager && <Tab label="Manage Team" />}
        </Tabs>
      </ModalHeader>
      <ModalBody className={selectedTab === 0 ? 'd-flex p-0' : 'p-2'}>
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
                isLoading={isLoading}
                onChange={onChange}
                searchResults={search.results}
                placeholder=""
              />
              <i className={manageStyles['help-text']}>
                Search by entering the full username, email, or last name.
              </i>
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
            <i className={manageStyles['help-text']}>
              The PI, Co-PIs, and Allocation Managers can manage the team.
            </i>
          </>
        )}
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
