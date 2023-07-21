import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { useSystemDisplayName } from 'hooks/datafiles';
import { useModal, useFileListing } from 'hooks/datafiles';
import { useMkdir } from 'hooks/datafiles/mutations';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button } from '_common';

const DataFilesMkdirModal = () => {
  const { toggle: toggleModal, getStatus: getModalStatus } = useModal();
  const isOpen = getModalStatus('mkdir');
  const { params } = useFileListing('FilesListing');
  const systemDisplayName = useSystemDisplayName(params);
  const { mkdir } = useMkdir();
  const toggle = () => toggleModal({ operation: 'mkdir', props: {} });

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

  const mkdirCallback = ({ dirname }) => {
    mkdir({
      api: params.api,
      scheme: params.scheme,
      system: params.system,
      path: params.path || '/',
      dirname,
      reloadCallback: reloadPage,
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
          onSubmit={mkdirCallback}
        >
          {({ isSubmitting }) => (
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
                <Button
                  type="primary"
                  size="long"
                  attr="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  Create Folder
                </Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default DataFilesMkdirModal;
