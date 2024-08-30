import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { DescriptionList } from '_common';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesPublicationRequestModal.module.scss';
import { formatDateTime } from 'utils/timeFormat';

const DataFilesPublicationRequestModal = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);

  const isOpen = useSelector((state) => state.files.modals.publicationRequest);
  const { publicationRequests } =
    useSelector((state) => state.files.modalProps.publicationRequest) || [];

  useEffect(() => {
    const data = {};

    publicationRequests?.forEach((request, index) => {
      const publicationRequestDataObj = {
        Status: request.status,
        Reviewers: request.reviewers.reduce((acc, reviewer, index) => {
          return (
            acc +
            (index > 0 ? ', ' : '') +
            `${reviewer.first_name} ${reviewer.last_name}`
          );
        }, ''),
        Submitted: formatDateTime(new Date(request.created_at)),
      };

      const heading = `Publication Request ${index + 1}`;

      data[heading] = <DescriptionList data={publicationRequestDataObj} />;
    });

    setData(data);
  }, [publicationRequests]);

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'publicationRequest', props: {} },
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
          Publication Requests
        </ModalHeader>
        <ModalBody>
          <DescriptionList
            className={`${styles['right-panel']} ${styles['panel-content']}`}
            data={data}
          />
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesPublicationRequestModal;
