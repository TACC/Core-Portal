import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesViewDataModal.module.scss';
import DescriptionList from '_common/DescriptionList';
import { formatLabel } from '../../_custom/drp/utils/utils';

const DataFilesViewDataModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.files.modals.viewData);
  const props = useSelector((state) => state.files.modalProps.viewData);

  const [descriptionListData, setDescriptionListData] = useState({});

  useEffect(() => {
    if (!props?.value) return;

    const values = Array.isArray(props.value) ? props.value : [props.value];

    const descriptionListFormattedData = values.map((val) => {
      const formattedData = Object.entries(val).reduce((acc, [key, value]) => {
        acc[formatLabel(key)] = formatLabel(value);
        return acc;
      }, {});
      return <DescriptionList data={formattedData} />;
    });

    // Prevents description list from having a header
    setDescriptionListData({ '': descriptionListFormattedData });
  }, [props]);

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'viewData', props: {} },
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
        {props?.key ? formatLabel(props.key) : ''}
      </ModalHeader>
      <ModalBody className={styles['modal-body']}>
        <DescriptionList
          className={`${styles['right-panel']} ${styles['panel-content']}`}
          data={descriptionListData}
        />
      </ModalBody>
    </Modal>
  );
};

export default DataFilesViewDataModal;
