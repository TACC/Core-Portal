import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { DescriptionList } from '_common';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesPublicationRequestModal.module.scss';
import { formatDate, formatDateTime } from 'utils/timeFormat';

const DataFilesPublicationRequestModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((state) => state.files.modals.publicationRequest);
  const { publicationRequests } =
    useSelector((state) => state.files.modalProps.publicationRequest) || [];

  // Compare function for sorting requests by creation date
  const compareFn = (req1, req2) => {
    // sort more recent requests first
    const date1 = new Date(req1.created_at);
    const date2 = new Date(req2.created_at);
    if (date1 < date2) {
      return 1;
    }
    if (date1 > date2) {
      return -1;
    }
    return 0;
  };

  const sortedRequests = [...(publicationRequests ?? [])].sort(compareFn);

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
          <dl className={`${styles['right-panel']} ${styles['panel-content']}`}>
            {sortedRequests.map((request) => (
              <React.Fragment key={request.id}>
                <dt>
                  {`Publication Request | ${formatDate(
                    new Date(request.created_at)
                  )}`}
                </dt>
                <dd>
                  <DescriptionList
                    data={{
                      Status: request.status,
                      Reviewers: request.reviewers.reduce(
                        (acc, reviewer, index) =>
                          acc +
                          (index > 0 ? ', ' : '') +
                          `${reviewer.first_name} ${reviewer.last_name}`,
                        ''
                      ),
                      Submitted: formatDateTime(new Date(request.created_at)),
                    }}
                  />
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesPublicationRequestModal;
