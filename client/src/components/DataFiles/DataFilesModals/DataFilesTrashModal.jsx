import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import { Button, FormField, InlineMessage, SectionMessage } from '_common';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { useTrash } from 'hooks/datafiles/mutations';
import { useSelectedFiles, useModal } from 'hooks/datafiles';
import styles from './DataFilesCompressModal.module.scss';

const DataFilesTrashModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { trash } = useTrash();
  const { getStatus: getModalStatus, toggle: toggleModal, getProps } = useModal();

  const isOpen = getModalStatus('trash');
  const { selectedFiles } = useSelectedFiles();
  const fileSsystem = selectedFiles[0]?.system;
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const formRef = React.useRef();

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
  };

  const toggle = () => toggleModal({ operation: 'trash', props: {} });

  const reloadPage = () => {
    navigate(location.pathname);
  };

  const trashCallback = () => {

    alert(JSON.stringify( getProps('trash') , null, 4));

  };

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Move to Trash
      </ModalHeader>
      <Formik
        innerRef={formRef}
        initialValues={selectedFiles}
        onSubmit={trashCallback}
      >
        {({ setFieldValue, values, isValid }) => {
          const formDisabled =
            status.type === 'RUNNING' || status.type === 'SUCCESS';
          return (
            <Form>
              <ModalBody>
                <p>
                  These files will be moved to the .Trash folder in {fileSsystem.homeDir}:
                </p>
                <ul>
                  {selectedFiles.map(item => <li key={item.id}>{item.name}</li>)}
                </ul>
                <p className={styles['info']}>
                  Trashed files are not deleted unless you empty the trash for this system.
                </p>
              </ModalBody>
              <ModalFooter>
                <InlineMessage
                  isVisible={status.type === 'SUCCESS'}
                  type="success"
                >
                  Successfully started move to trash job
                </InlineMessage>
                <InlineMessage isVisible={status.type === 'ERROR'} type="error">
                  {status.message}
                </InlineMessage>
                <Button
                  isLoading={status.type === 'RUNNING'}
                  type="primary"
                  size={status.type === 'ERROR' ? 'long' : 'medium'}
                  iconNameBefore={status.type === 'ERROR' ? 'alert' : null}
                  attr="submit"
                >
                  Move to Trash
                </Button>
              </ModalFooter>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default DataFilesTrashModal;
