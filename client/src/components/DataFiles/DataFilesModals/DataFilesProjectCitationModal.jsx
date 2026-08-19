import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Citations } from '_common/Citations/Citations';

const DataFilesProjectCitationModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.files.modals.projectCitation);
  const props = useSelector((state) => state.files.modalProps.projectCitation);

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'projectCitation', props: {} },
    });
  }, []);

  return (
    <>
      {props?.project && (
        <Modal
          size="lg"
          isOpen={isOpen}
          toggle={toggle}
        >
          <ModalHeader toggle={toggle} charCode="&#xe912;">
            Citations
          </ModalHeader>
          <ModalBody>
            <Citations
              project={props.project}
              authors={props.project.authors}
            />
          </ModalBody>
        </Modal>
      )}
    </>
  );
};

export default DataFilesProjectCitationModal;
