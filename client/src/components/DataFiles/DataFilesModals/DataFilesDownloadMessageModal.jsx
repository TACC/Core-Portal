import React, { useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  InputGroupAddon
} from 'reactstrap';
import {
  LoadingSpinner,
  FormField,
  Icon,
  InlineMessage,
  SectionMessage
} from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesDownloadMessageModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const status = useSelector(
    state => state.files.operationStatus.compress,
    shallowEqual
  );

  const isOpen = useSelector(state => state.files.modals.downloadMessage);

  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );

  const selectedFiles = useSelector(
    ({ files: { selected, listing } }) =>
      selected.FilesListing.map(i => ({
        ...listing.FilesListing[i]
      })),
    shallowEqual
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const formRef = React.useRef();

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' }
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (status) {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: {}, operation: 'compress' }
      });
      history.push(location.pathname);
    }
  };

  const compressCallback = () => {
    const { filenameDisplay, filetype } = formRef.current.values;
    const filename = `${filenameDisplay}${filetype}`;
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload: { filename, files: selected }
    });
  };

  let buttonIcon;
  if (status === 'RUNNING') {
    buttonIcon = <LoadingSpinner placement="inline" />;
  } else if (status === 'ERROR') {
    buttonIcon = <Icon name="alert" />;
  } else {
    buttonIcon = null;
  }
  const initialValues = {
    filenameDisplay:
      selectedFiles[0] && selectedFiles.length === 1
        ? selectedFiles[0].name
        : '',
    filetype: '.zip'
  };
  const validationSchema = yup.object().shape({
    filenameDisplay: yup
      .string()
      .trim('The filename cannot include leading and trailing spaces')
      .strict(true)
      .required('The filename is required')
  });

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'downloadMessage', props: {} }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      size="lg"
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Download Folder
      </ModalHeader>
      <Formik
        innerRef={formRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={compressCallback}
      >
        {({ setFieldValue, values, isValid }) => {
          const handleSelectChange = e => {
            setFieldValue('filetype', e.target.value);
          };
          const formDisabled = status === 'RUNNING' || status === 'SUCCESS';
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
                    <InputGroupAddon addonType="append" className={styles['input-field']}>
                      <Input
                        type="select"
                        name="filetype"
                        bsSize="sm"
                        onChange={handleSelectChange}
                        disabled={formDisabled}
                        className={styles['bg-color']}
                      >
                        <option value=".zip">.zip</option>
                        <option value=".tar.gz">.tar.gz</option>
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
                <InlineMessage isVisible={status === 'SUCCESS'} type="success">
                  Successfully started compress job
                </InlineMessage>
                <Button
                  className={`data-files-btn ${styles['submit-button']}`}
                  disabled={buttonDisabled}
                  type="submit"
                >
                  {buttonIcon}
                  <span className={buttonIcon ? styles['with-icon'] : ''}>
                    Compress
                  </span>
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
