import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';

const DataFilesAddProject = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.addproject);

  const { user } = useSelector(state => state.authenticatedUser);

  // I would like to set the person creating the project as the "Owner" (PI)
  // Unfortunately, useState does not create a new default state just because 
  // useSelector came up with a new value for { user }
  const [ members, setMembers ] = useState([]);
  // This doesn't work:
  // const [ members, setMembers ] = useState([ { user, access: "owner" }])

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

  // Setting the owner of this project during new project creation as the sole member
  // This is a hack, due to redux not setting authenticatedUser state until after
  // this modal has rendered
  const onSetOwner = useCallback(
    (user) => {
      setMembers([ { user, access: "owner" }])
    }
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
                onSetOwner={onSetOwner}
                defaultOwner={user}
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
