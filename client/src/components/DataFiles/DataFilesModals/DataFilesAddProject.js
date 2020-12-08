import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';

const DataFilesAddProject = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.addproject);
  const { user } = useSelector(state => state.authenticatedUser)
  const [ members, setMembers ] = useState([]);
  useEffect(() => {
    if (user) {
      setMembers([ {user, access: "owner" }])
    }
  }, [ user ]);

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'addproject', props: {} }
    });
  };

  const addproject = ({ title }) => {
    dispatch({
      type: 'PROJECTS_ADD_PROJECT',
      payload: {}
    });
  };

  const onAdd = useCallback(
    (user) => {
      setMembers([ { user, access: "edit" }, ...members ]);
    }, [ members, setMembers ]
  )

  const onRemove = useCallback(
    (user) => {
      let index = members.findIndex(el => el.user.username === user.username && el.access !== "owner");
      if (index) {
        members.splice(index, 1);
        setMembers(members);
      }
    }, [ setMembers ]
  )

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className="dataFilesModal"
      >
        {' '}
        <Formik initialValues={{ title: '' }} onSubmit={addproject}>
          <Form>
            <ModalHeader toggle={toggle}>Add Shared Workspace</ModalHeader>
            <ModalBody>
              <FormField name="title" label="Workspace Title" />
              <DataFilesProjectMembers 
                members={members}
                onAdd={onAdd}
                onRemove={onRemove}
                />
            </ModalBody>
            <ModalFooter>
              <Button type="submit" className="data-files-btn">
                Add Workspace
              </Button>
            </ModalFooter>
          </Form>
        </Formik>
      </Modal>
    </>
  );
};

export default DataFilesAddProject;
