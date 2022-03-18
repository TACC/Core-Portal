import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  InputGroupAddon,
} from 'reactstrap';
import { LoadingSpinner, FormField, Icon, InlineMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { useCompress } from 'hooks/datafiles/mutations';
import { useSelectedFiles, useModal, useFileListing } from 'hooks/datafiles';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesCompressModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();

  const { compress, status, setStatus } = useCompress();
  const { getStatus: getModalStatus, toggle: toggleModal} = useModal();
  const { params } = useFileListing('FilesListing')

  const isOpen = getModalStatus('compress')
  const { selectedFiles } = useSelectedFiles();
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const formRef = React.useRef();

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' },
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (status) {
      setStatus({})
      history.push(location.pathname);
    }
  };

  const toggle = () => toggleModal({operation: 'compress', props: {}})

  const compressCallback = () => {
    const { filenameDisplay, filetype } = formRef.current.values;
    const filename = `${filenameDisplay}${filetype}`;
    compress({filename, files: selected})
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
    filetype: '.zip',
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
      onOpened={onOpened}
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
            setFieldValue('filetype', e.target.value);
          };
          const formDisabled = status === 'RUNNING' || status === 'SUCCESS';
          const buttonDisabled =
            formDisabled || !isValid || values.filenameDisplay === '';
          return (
            <Form>
              <ModalBody>
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
                  A job to compress these files will be submitted. The
                  compressed file will appear in this directory.
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

export default DataFilesCompressModal;
