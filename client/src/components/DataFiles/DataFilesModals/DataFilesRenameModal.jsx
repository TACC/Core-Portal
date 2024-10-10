import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button } from '_common';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { useModal, useFileListing } from 'hooks/datafiles';
import { useRename } from 'hooks/datafiles/mutations';

const DataFilesRenameModal = () => {
  const { getStatus, getProps, toggle: toggleModal } = useModal();
  const isOpen = getStatus('rename');
  const selected = getProps('rename').selectedFile ?? {};
  const {
    params: { api, scheme },
  } = useFileListing('FilesListing');

  const { rename: renameCallback, setStatus } = useRename();

  const toggle = () => toggleModal({ operation: 'rename', props: {} });

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const reloadPage = (name, newPath) => {
    history.push(location.pathname);
  };

  const validationSchema = Yup.object().shape({
    newName: Yup.string()
      .min(1)
      .matches(
        /^[\d\w\s\-_.()]+$/,
        'Please enter a valid file name (accepted characters are A-Z a-z 0-9 () - _ .)'
      )
      .notOneOf(
        [selected.name],
        'The new name must differ from the current name.'
      )
      .required('Please enter a valid file name.'),
  });

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
  };

  const rename = ({ newName }) => {
    renameCallback({
      selectedFile: selected,
      newName,
      callback: reloadPage,
      api,
      scheme,
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
            <Button attr="submit" type="primary" size="medium">
              Rename
            </Button>
          </ModalFooter>
        </Form>
      </Formik>
    </Modal>
  );
};

export default DataFilesRenameModal;
