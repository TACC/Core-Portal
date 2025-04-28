import React, { useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import { Button, FormField, InlineMessage, SectionMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { useCompress } from 'hooks/datafiles/mutations';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesDownloadMessageModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const { compress, status, setStatus } = useCompress();

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
      setStatus({});
      history.push(location.pathname);
    }
  };

  // Toggles the Large Download Modal when a user selects files to download totaling more than 2 GB
  const toggleDataFilesLargeDownloadModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'largeDownload',
        props: {},
      },
    });
  };

  // Toggles the No Folders Modal when a user selects 1 or more folders to download
  const toggleDataFilesNoFoldersModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'noFolders',
        props: {},
      },
    });
  };

  const compressCallback = () => {
    const { filenameDisplay, compressionType } = formRef.current.values;
    let containsFolder = false;
    let totalFileSize = 0;
    const maxFileSize = 2 * 1024 * 1024 * 1024;
    // Add up the file sizes of all files and shows if the user selected a folder
    for (let i = 0; i < selectedFiles.length; i++) {
      totalFileSize = totalFileSize + selectedFiles[i].length;
      if (selectedFiles[i].format == 'folder') {
        containsFolder = true;
      }
    }
    // Run the dispatch if the user does not select any folders...
    if (containsFolder === false) {
      // ...and if the total file size is below 2 GB
      if (totalFileSize < maxFileSize) {
        compress({
          filename: filenameDisplay,
          files: selectedFiles,
          compressionType,
          fromDownload: true,
        });
        // Prevent the compression process and redirect the user to Globus otherwise
      } else {
        toggleDataFilesLargeDownloadModal();
      }
      // Prevents compression of folders if a folder is among the selected files
    } else {
      toggleDataFilesNoFoldersModal();
    }
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
                  isLoading={status === 'RUNNING'}
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
