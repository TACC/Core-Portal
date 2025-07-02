import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesProjectTreeModal.module.scss';
import { ProjectTreeView } from '_custom/drp/DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ProjectTreeView';

const DataFilesProjectTreeModal = () => {
  const { projectId } = useSelector((state) => state.projects.metadata);

  const isOpen = useSelector((state) => state.files.modals.projectTree);
  const props = useSelector((state) => state.files.modalProps['projectTree']);

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'projectTree', props: {} },
    });
  }, []);

  const dispatch = useDispatch();

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className={styles['modal-dialog']}
      >
        <ModalHeader toggle={toggle} charCode="&#xe912;">
          Tree Diagram
        </ModalHeader>
        <ModalBody className={styles['modal-body']}>
          {' '}
          <ProjectTreeView
            projectId={projectId}
            readOnly={props?.readOnly ?? true}
          />
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesProjectTreeModal;
