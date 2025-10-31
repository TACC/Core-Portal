import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { Button, InlineMessage } from '_common';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useHistory, useRouteMatch } from 'react-router-dom';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';

const DataFilesAddProjectModal = () => {
  const history = useHistory();
  const match = useRouteMatch();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.authenticatedUser);
  const [members, setMembers] = useState(
    user ? [{ user, access: 'owner' }] : []
  );

  useEffect(() => {
    setMembers([
      ...members.filter((member) => member.user.username !== user.username),
      { user, access: 'owner' },
    ]);
  }, [user]);

  const isOpen = useSelector((state) => state.files.modals.addproject);
  const isCreating = useSelector((state) => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'create' &&
      state.projects.operation.loading
    );
  });

  const error = useSelector((state) => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'create' &&
      state.projects.operation.error
    );
  });

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'addproject', props: {} },
    });
  };

  const onCreate = (system) => {
    toggle();
    history.push(`${match.path}/tapis/projects/${system}`);
  };

  const addproject = ({ title, description }) => {
    dispatch({
      type: 'PROJECTS_CREATE',
      payload: {
        title,
        description,
        members: members.map((member) => ({
          username: member.user.username,
          access: member.access,
        })),
        onCreate,
      },
    });
  };

  const onAdd = (newUser) => {
    setMembers([...members, newUser]);
  };

  const onRemove = (removedUser) => {
    setMembers(
      members.filter((m) => m.user.username !== removedUser.user.username)
    );
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title must be at most 150 characters')
      .required('Please enter a title.'),
    description: Yup.string()
      .max(800, 'Description must be at most 800 characters')
      .required('Please enter a description.'),
  });

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className="dataFilesModal"
      >
        {' '}
        <Formik
          initialValues={{ title: '', description: '' }}
          onSubmit={addproject}
          validationSchema={validationSchema}
        >
          <Form>
            <ModalHeader toggle={toggle} charCode="&#xe912;">
              Add Shared Workspace
            </ModalHeader>
            <ModalBody>
              <FormField
                name="title"
                label={
                  <div>
                    Workspace Title{' '}
                    <small>
                      <em>(Maximum 150 characters)</em>
                    </small>
                  </div>
                }
              />
              <FormField
                name="description"
                label={
                  <div>
                    Workspace Description{' '}
                    <small>
                      <em>(Maximum 800 characters)</em>
                    </small>
                  </div>
                }
              />
              <DataFilesProjectMembers
                members={members}
                onAdd={onAdd}
                onRemove={onRemove}
              />
            </ModalBody>
            <ModalFooter>
              {error ? (
                <InlineMessage type="error">
                  Your shared workspace could not be created
                </InlineMessage>
              ) : null}
              <Button
                type="primary"
                size="long"
                attr="submit"
                isLoading={isCreating}
              >
                Add Workspace
              </Button>
            </ModalFooter>
          </Form>
        </Formik>
      </Modal>
    </>
  );
};

export default DataFilesAddProjectModal;
