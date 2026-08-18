import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesProjectTreeModal.module.scss';
import { useAddonComponents } from 'hooks/datafiles';

const DataFilesProjectTreeModal = () => {
  const dispatch = useDispatch();

  const { projectId } = useSelector((state) => state.projects.metadata);
  const portalName = useSelector((state) => state.workbench.portalName);

  const isOpen = useSelector((state) => state.files.modals.projectTree);
  const props = useSelector((state) => state.files.modalProps['projectTree']);

  const { DataFilesProjectTree } = useAddonComponents({ portalName });

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'projectTree', props: {} },
    });
  }, []);

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
          {DataFilesProjectTree && (
            <DataFilesProjectTree
              projectId={projectId}
              readOnly={props?.readOnly ?? true}
            />
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesProjectTreeModal;
