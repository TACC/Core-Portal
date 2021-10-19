import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { findSystemOrProjectDisplayName } from 'utils/systems';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const DataFilesMkdirModal = () => {
  const dispatch = useDispatch();
  const systemList = useSelector(
    (state) => state.systems.storage.configuration
  );
  const projectsList = useSelector((state) => state.projects.listing.projects);
  const isOpen = useSelector((state) => state.files.modals.mkdir);
  const params = useSelector(
    (state) => state.files.params.FilesListing,
    shallowEqual
  );
  const systemDisplayName = findSystemOrProjectDisplayName(
    params.scheme,
    systemList,
    projectsList,
    params.system
  );
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} },
    });
  };

  const validationSchema = Yup.object().shape({
    dirname: Yup.string()
      .min(1)
      .matches(
        /^[\d\w\s\-_.]+$/,
        'Please enter a valid directory name (accepted characters are A-Z a-z 0-9 - _ .)'
      )
      .required('Please enter a valid directory name.'),
  });

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const mkdir = ({ dirname }) => {
    dispatch({
      type: 'DATA_FILES_MKDIR',
      payload: {
        api: params.api,
        scheme: params.scheme,
        system: params.system,
        path: params.path || '/',
        dirname,
        reloadCallback: reloadPage,
      },
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
        <Formik
          initialValues={{ dirname: '' }}
          validationSchema={validationSchema}
          onSubmit={mkdir}
        >
          <Form>
            <ModalHeader toggle={toggle} charCode="&#xe912;">
              Creating folder in {systemDisplayName}/{params.path}
            </ModalHeader>
            <ModalBody>
              <FormField
                name="dirname"
                label="Enter a name for the new folder:"
              />
            </ModalBody>
            <ModalFooter>
              <Button type="submit" className="data-files-btn">
                Create Folder
              </Button>
            </ModalFooter>
          </Form>
        </Formik>
      </Modal>
    </>
  );
};

export default DataFilesMkdirModal;
