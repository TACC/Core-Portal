import React, { useCallback } from 'react';
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
  const isOpen = useSelector(state => state.files.modals.manageproject);
  const { members } = useSelector(state => {
    console.log(state.projects);
    return state.projects.metadata;
  });
  const isCreating = useSelector(state => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'create' &&
      state.projects.operation.loading
    );
  });

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'manageproject', props: {} }
    });
  };

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
          />
          <div styleName="owner-controls">
            <Button
              color="link"
            >
              <h7>Change Ownership</h7>
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default DataFilesManageProjectModal;
