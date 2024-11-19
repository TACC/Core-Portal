import InfiniteScrollTable from '_common/InfiniteScrollTable';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesPublicationAuthorsModal.module.scss'


const DataFilesPublicationAuthorsModal = () => {

    const dispatch = useDispatch();
    const isOpen = useSelector((state) => state.files.modals.publicationAuthors);
    const props = useSelector((state) => state.files.modalProps.publicationAuthors);

    const columns = [
        {
            Header: 'Name',
            accessor: (el) => el,
            Cell: (el) => {
                const { first_name, last_name } = el.value;
                return (
                <span className={styles.content}>
                    {first_name} {last_name}
                </span>
                );
            },
        },
        {
            Header: 'Email',
            accessor: 'email',
        },
    ];

    const toggle = useCallback(() => {
        dispatch({
          type: 'DATA_FILES_TOGGLE_MODAL',
          payload: { operation: 'publicationAuthors', props: {} },
        });
      }, [dispatch]);

      return (
        <Modal
          size="lg"
          isOpen={isOpen}
          toggle={toggle}
          className={styles['modal-dialog']}
        >
          <ModalHeader toggle={toggle} charCode="&#xe912;">
            Authors
          </ModalHeader>
          <ModalBody className={styles['modal-body']}>
            <InfiniteScrollTable
                tableColumns={columns}
                tableData={props?.authors || []}
                className={styles['author-listing']}
            />
          </ModalBody>
        </Modal>
    );
};

export default DataFilesPublicationAuthorsModal;