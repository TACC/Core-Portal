import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';

const DataFilesRenameModal = () => {
  const isOpen = useSelector((state) => state.files.modals.rename);

  const selected = useSelector(
    (state) => state.files.modalProps.rename.selectedFile || {}
  );
  const { api, scheme } = useSelector(
    (state) => state.files.params.FilesListing
  );

  const dispatch = useDispatch();
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'rename', props: {} },
    });
  };

  const history = useHistory();
  const location = useLocation();
  const reloadPage = (name, newPath) => {
    history.push(location.pathname);
  };

  const validationSchema = Yup.object().shape({
    newName: Yup.string()
      .min(1)
      .matches(
        /^[\d\w\s\-_.]+$/,
        'Please enter a valid file name (accepted characters are A-Z a-z 0-9 - _ .)'
      )
      .notOneOf(
        [selected.name],
        'The new name must differ from the current name.'
      )
      .required('Please enter a valid file name.'),
  });

  const onClosed = () => {
    dispatch({
      type: 'DATA_FILES_SET_OPERATION_STATUS',
      payload: { status: null, operation: 'rename' },
    });
  };

  const rename = ({ newName }) => {
    dispatch({
      type: 'DATA_FILES_RENAME',
      payload: {
        selectedFile: selected,
        newName,
        reloadCallback: reloadPage,
        api,
        scheme,
      },
    });
    toggle();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <Formik
        initialValues={{ newName: selected.name }}
        validationSchema={validationSchema}
        onSubmit={rename}
      >
        <Form>
          <ModalHeader toggle={toggle} charCode="&#xe912;">
            Rename {selected.name}
          </ModalHeader>
          <ModalBody>
            <FormField
              name="newName"
              label="Enter a new name for this file/folder:"
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" className="data-files-btn">
              Rename
            </Button>
          </ModalFooter>
        </Form>
      </Formik>
    </Modal>
  );
};

export default DataFilesRenameModal;
