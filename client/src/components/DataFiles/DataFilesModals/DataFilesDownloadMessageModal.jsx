import React, { useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  InputGroupAddon,
} from 'reactstrap';
import { Button, FormField, InlineMessage, SectionMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesDownloadMessageModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const status = useSelector(
    (state) => state.files.operationStatus.compress,
    shallowEqual
  );

  const isOpen = useSelector((state) => state.files.modals.downloadMessage);

  const params = useSelector(
    (state) => state.files.params.FilesListing,
    shallowEqual
  );

  const selectedFiles = useSelector(
    ({ files: { selected, listing } }) =>
      selected.FilesListing.map((i) => ({
        ...listing.FilesListing[i],
      })),
    shallowEqual
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const formRef = React.useRef();

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (status) {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: {}, operation: 'compress' },
      });
      history.push(location.pathname);
    }
  };

  const compressCallback = () => {
    const { filenameDisplay, compressionType } = formRef.current.values;
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload: {
        filename: filenameDisplay,
        files: selected,
        scheme: params.scheme,
        compressionType,
        onSuccess: {
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: { operation: 'downloadMessage', props: {} },
        },
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

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'downloadMessage', props: {} },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      size="md"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Download
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
                <SectionMessage type="warning">
                  Folders and multiple files must be compressed before
                  downloading.
                </SectionMessage>
                <FormField
                  label="Compressed File Name"
                  name="filenameDisplay"
                  disabled={formDisabled}
                  addonType="append"
                  addon={
                    <InputGroupAddon
                      addonType="append"
                      className={styles['input-field']}
                    >
                      <Input
                        type="select"
                        name="compressionType"
                        bsSize="sm"
                        onChange={handleSelectChange}
                        disabled={formDisabled}
                        className={styles['bg-color']}
                      >
                        <option value="zip">.zip</option>
                        <option value="tgz">.tar.gz</option>
                      </Input>
                    </InputGroupAddon>
                  }
                />
                <p>
                  <em>
                    A job to compress the folder(s) and/or files will be
                    submitted. The compressed file will appear in this directory
                    for you to download.
                  </em>
                </p>
              </ModalBody>
              <ModalFooter>
                <InlineMessage
                  isVisible={status.type === 'SUCCESS'}
                  type="success"
                >
                  Successfully started compress job
                </InlineMessage>
                {status.type === 'ERROR' && status.message && (
                  <InlineMessage type="error">{status.message}</InlineMessage>
                )}
                <Button
                  disabled={buttonDisabled}
                  type="primary"
                  size={status.type === 'ERROR' ? 'long' : 'medium'}
                  isLoading={status.type === 'RUNNING'}
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

export default DataFilesDownloadMessageModal;
