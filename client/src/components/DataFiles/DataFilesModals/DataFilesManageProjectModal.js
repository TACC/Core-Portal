import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message } from '_common';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';
import './DataFilesManageProject.module.scss';

const DataFilesManageProjectModal = () => {
  const dispatch = useDispatch();
  const [transferMode, setTransferMode] = useState(false);
  const isOpen = useSelector(state => state.files.modals.manageproject);
  const { members, projectId } = useSelector(state => state.projects.metadata);
  const { user } = useSelector(state => state.authenticatedUser);
  const { loading, error } = useSelector(state => {
    if (
      state.projects.operation &&
      state.projects.operation.name === 'member'
    ) {
      return state.projects.operation;
    }
    return {
      loading: false,
      error: false
    };
  });

  const toggle = useCallback(() => {
    setTransferMode(false);
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'manageproject', props: {} }
    });
  }, [setTransferMode]);

  const onAdd = useCallback(
    newUser => {
      dispatch({
        type: 'PROJECTS_SET_MEMBER',
        payload: {
          projectId,
          data: {
            action: 'add_member',
            username: newUser.user.username
          }
        }
      });
    },
    [projectId, dispatch]
  );

  const onRemove = useCallback(
    removedUser => {
      dispatch({
        type: 'PROJECTS_SET_MEMBER',
        payload: {
          projectId,
          data: {
            action: 'remove_member',
            username: removedUser.user.username
          }
        }
      });
    },
    [projectId, dispatch]
  );

  const onTransfer = useCallback(
    newOwner => {
      const oldOwner = members.find(member => member.access === 'owner');
      dispatch({
        type: 'PROJECTS_SET_MEMBER',
        payload: {
          projectId,
          data: {
            action: 'transfer_ownership',
            oldOwner: oldOwner.user.username,
            newOwner: newOwner.user.username
          }
        }
      });
      setTransferMode(false);
    },
    [projectId, members, dispatch, setTransferMode]
  );

  const toggleTransferMode = useCallback(() => {
    setTransferMode(!transferMode);
  }, [transferMode, setTransferMode]);

  const isOwner = members.some(
    member =>
      member.user &&
      user &&
      member.user.username === user.username &&
      member.access === 'owner'
  );

  return (
    <div styleName="root">
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className="dataFilesModal"
      >
        <ModalHeader toggle={toggle}>Manage Team</ModalHeader>
        <ModalBody>
          <DataFilesProjectMembers
            members={members}
            onAdd={onAdd}
            onRemove={onRemove}
            onTransfer={onTransfer}
            loading={loading}
            mode={transferMode ? 'transfer' : 'addremove'}
          />
          {error ? (
            <div styleName="error">
              <Message type="warn">
                An error occurred while modifying team members
              </Message>
            </div>
          ) : null}
          <div styleName="owner-controls">
            {isOwner ? (
              <Button color="link" onClick={toggleTransferMode}>
                <h6 styleName="ownership-toggle">
                  {transferMode
                    ? 'Cancel Change Ownership'
                    : 'Change Ownership'}
                </h6>
              </Button>
            ) : null}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default DataFilesManageProjectModal;
