import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import DataFilesProjectMembers from '../DataFilesProjectMembers/DataFilesProjectMembers';

const DataFilesAddProject = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.addproject);
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
              <DataFilesProjectMembers />
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
