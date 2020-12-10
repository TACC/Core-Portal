import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { LoadingSpinner } from '_common';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useHistory, useRouteMatch } from 'react-router-dom';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';
import './DataFilesManageProject.module.scss';

const DataFilesManageProjectModal = () => {
  const dispatch = useDispatch();
  const [ transferMode, setTransferMode ] = useState(false);
  const isOpen = useSelector(state => state.files.modals.manageproject);
  const { members } = useSelector(state => state.projects.metadata);
  const { user } = useSelector(state => state.authenticatedUser);
  const isCreating = useSelector(state => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'create' &&
      state.projects.operation.loading
    );
  });

  const toggle = useCallback(
    () => {
      setTransferMode(false);
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'manageproject', props: {} }
      });
    }, [setTransferMode]
  );

  const onAdd = useCallback(
    newUser => {
      dispatch({
        type: 'PROJECTS_MEMBER_LIST_ADD',
        payload: newUser
      });
    },
    [dispatch]
  );

  const onRemove = useCallback(
    removedUser => {
      dispatch({
        type: 'PROJECTS_MEMBER_LIST_REMOVE',
        payload: removedUser
      });
    },
    [dispatch]
  );

  const toggleTransferMode = useCallback(
    () => {
      setTransferMode(!transferMode);
    },
    [transferMode, setTransferMode]
  )

  const isOwner = members.some(
    member => member.user && user && 
      member.user.username === user.username && member.access === 'owner');

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
            mode={transferMode ? 'transfer' : 'addremove'}
          />
          <div styleName="owner-controls">
            {
              isOwner
                ? <Button
                    color="link"
                    onClick={toggleTransferMode}
                  >
                    <h7>{ transferMode ? 'Cancel Change Ownership' : 'Change Ownership' }</h7>
                  </Button>
                : null
            }
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default DataFilesManageProjectModal;
