import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import { Button, FormField, InlineMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { useCompress } from 'hooks/datafiles/mutations';
import { useSelectedFiles, useModal } from 'hooks/datafiles';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesCompressModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();

  const { compress, status, setStatus } = useCompress();
  const { getStatus: getModalStatus, toggle: toggleModal } = useModal();

  const isOpen = getModalStatus('compress');
  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const formRef = React.useRef();

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (status) {
      setStatus({});
      history.push(location.pathname);
    }
  };

  const toggle = () => toggleModal({ operation: 'compress', props: {} });

  const compressCallback = () => {
    const { filenameDisplay, compressionType } = formRef.current.values;
    compress({
      filename: filenameDisplay,
      files: selected,
      compressionType,
      onSuccess: {
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'compress', props: {} },
      },
    });
  };

  const initialValues = {
    filenameDisplay:
      selectedFiles[0] && selectedFiles.length === 1
        ? selectedFiles[0].name
        : `Archive_${new Date().toISOString().split('.')[0]}`,
    compressionType: 'zip',
  };
  const validationSchema = yup.object().shape({
    filenameDisplay: yup
      .string()
      .trim('The filename cannot include leading and trailing spaces')
      .strict(true)
      .required('The filename is required'),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Compress Files
      </ModalHeader>
      <Formik
        innerRef={formRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={compressCallback}
      >
        {({ setFieldValue, values, isValid }) => {
          const handleSelectChange = (e) => {
            setFieldValue('compressionType', e.target.value);
          };
          const formDisabled =
            status.type === 'RUNNING' || status.type === 'SUCCESS';
          const buttonDisabled =
            formDisabled || !isValid || values.filenameDisplay === '';
          return (
            <Form>
              <ModalBody>
                <FormField
                  label="Compressed File Name"
                  name="filenameDisplay"
                  id="filenameDisplay"
                  disabled={formDisabled}
                  addonType="append"
                  addon={
                    <Input
                      type="select"
                      name="compressionType"
                      bsSize="sm"
                      onChange={handleSelectChange}
                      disabled={formDisabled}
                      style={{ maxWidth: '100px' }}
                      className={styles['bg-color']}
                    >
                      <option value="zip">.zip</option>
                      <option value="tgz">.tar.gz</option>
                    </Input>
                  }
                />
                <p>
                  A job to compress these files will be submitted. You can check
                  the status of this job on your Dashboard, and the compressed
                  file archive will appear in this directory.
                </p>
              </ModalBody>
              <ModalFooter>
                <InlineMessage
                  isVisible={status.type === 'SUCCESS'}
                  type="success"
                >
                  Successfully started compress job
                </InlineMessage>
                <Button
                  disabled={buttonDisabled}
                  isLoading={status.type === 'RUNNING'}
                  type="primary"
                  size={status.type === 'ERROR' ? 'long' : 'medium'}
                  iconNameBefore={status.type === 'ERROR' ? 'alert' : null}
                  attr="submit"
                >
                  Compress
                </Button>
              </ModalFooter>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default DataFilesCompressModal;
