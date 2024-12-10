import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Button, Message } from '_common';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';
import styles from './DataFilesManageProject.module.scss';
import { useAddonComponents } from 'hooks/datafiles';

const DataFilesManageProjectModal = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [transferMode, setTransferMode] = useState(false);
  const isOpen = useSelector((state) => state.files.modals.manageproject);
  const { members, projectId } = useSelector(
    (state) => state.projects.metadata
  );
  const { user } = useSelector((state) => state.authenticatedUser);
  const { loading, error } = useSelector((state) => {
    if (
      state.projects.operation &&
      state.projects.operation.name === 'member'
    ) {
      return state.projects.operation;
    }
    return {
      loading: false,
      error: false,
    };
  });

  const canEditSystem = members
    .filter((member) => member.user.username === user.username)
    .map((currentUser) => currentUser.access === 'owner')[0];

  const readOnlyTeam = useSelector((state) => {
    const projectSystem = state.systems.storage.configuration.find(
      (s) => s.scheme === 'projects'
    );

    return projectSystem?.readOnly || !canEditSystem;
  });

  const portalName = useSelector((state) => state.workbench.portalName);

  const { DataFilesManageProjectModalAddon } = useAddonComponents({
    portalName,
  });

  const toggle = useCallback(() => {
    setTransferMode(false);
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'manageproject', props: {} },
    });
  }, [setTransferMode]);

  const onAdd = useCallback(
    (newUser) => {
      dispatch({
        type: 'PROJECTS_SET_MEMBER',
        payload: {
          projectId,
          data: {
            action: 'add_member',
            username: newUser.user.username,
          },
        },
      });
    },
    [projectId, dispatch]
  );

  const onOpen = () =>
    dispatch({ type: 'PROJECTS_SET_MEMBER_RESET', payload: {} });

  const onRemove = useCallback(
    (removedUser) => {
      dispatch({
        type: 'PROJECTS_SET_MEMBER',
        payload: {
          projectId,
          data: {
            action: 'remove_member',
            username: removedUser.user.username,
          },
        },
      });
      if (removedUser.user.username === user.username) {
        toggle();
        history.push('/workbench/data/tapis/projects');
      }
    },
    [projectId, dispatch, history, toggle]
  );

  const onTransfer = useCallback(
    (newOwner) => {
      const oldOwner = members.find((member) => member.access === 'owner');
      dispatch({
        type: 'PROJECTS_SET_MEMBER',
        payload: {
          projectId,
          data: {
            action: 'transfer_ownership',
            oldOwner: oldOwner.user.username,
            newOwner: newOwner.user.username,
          },
        },
      });
      setTransferMode(false);
    },
    [projectId, members, dispatch, setTransferMode]
  );

  const toggleTransferMode = useCallback(() => {
    setTransferMode(!transferMode);
  }, [transferMode, setTransferMode]);

  const isOwner = members.some(
    (member) =>
      member.user &&
      user &&
      member.user.username === user.username &&
      member.access === 'owner'
  );

  return (
    <div className={styles.root}>
      <Modal
        size="xl"
        isOpen={isOpen}
        onOpened={onOpen}
        toggle={toggle}
        className="dataFilesModal"
      >
        <ModalHeader toggle={toggle} charCode="&#xe912;">
          {readOnlyTeam ? 'View' : 'Manage'} Team
        </ModalHeader>
        <ModalBody>
          <DataFilesProjectMembers
            projectId={projectId}
            members={members}
            onAdd={onAdd}
            onRemove={onRemove}
            onTransfer={onTransfer}
            loading={loading}
            mode={transferMode ? 'transfer' : 'addremove'}
          />
          {error ? (
            <div className={styles.error}>
              <Message type="warn">
                An error occurred while modifying team members
              </Message>
            </div>
          ) : null}
          <div className={styles['owner-controls']}>
            {isOwner && members.length > 1 && !readOnlyTeam ? (
              <Button type="link" onClick={toggleTransferMode}>
                {transferMode ? 'Cancel Change Ownership' : 'Change Ownership'}
              </Button>
            ) : null}
          </div>
          {DataFilesManageProjectModalAddon && (
            <DataFilesManageProjectModalAddon projectId={projectId} />
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default DataFilesManageProjectModal;
