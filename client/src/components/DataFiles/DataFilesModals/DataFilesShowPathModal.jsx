import React, { useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { TextCopyField } from '_common';
import styles from './DataFilesShowPathModal.module.scss';

const DataFilesShowPathModal = React.memo(({ api }) => {
  const dispatch = useDispatch();
  const params = useSelector(
    (state) => state.files.params.FilesListing,
    shallowEqual
  );

  useEffect(() => {
    if (params.api === 'tapis' && params.system) {
      dispatch({
        type: 'FETCH_SYSTEM_DEFINITION',
        payload: params.system,
      });
    }
  }, [params, dispatch]);

  const { file } = useSelector((state) => state.files.modalProps.showpath);

  const definition = useSelector((state) => {
    if (!file) {
      return null;
    }
    const matching = state.systems.definitions.list.find(
      (sys) => sys.id === file.system
    );
    return matching;
  });

  const isOpen = useSelector(
    (state) => state.files.modals.showpath && Boolean(definition)
  );

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'showpath', props: {} },
    });

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
  };

  if (file)
    return (
      <Modal
        isOpen={isOpen}
        onClosed={onClosed}
        toggle={toggle}
        className="dataFilesModal"
      >
        <ModalHeader
          toggle={toggle}
          charCode="&#xe912;"
          className={styles['custom-modal-header']}
        >
          View Full Path
        </ModalHeader>
        <ModalBody>
          {(params.api === 'tapis' || api === 'tapis') && definition && (
            <>
              <span className={styles['storage-host']}>Storage Host</span>
              <span className={styles['storage-values']}>
                {definition.host}
              </span>
              <span className={styles['storage-path']}>Storage Path</span>
              <TextCopyField
                className={styles['custom-textcopyfield']}
                value={`${definition.rootDir}/${file.path}`.replace('//', '/')}
                displayField="textarea"
              />
            </>
          )}
          {params.api === 'googledrive' && (
            <>
              <span className={styles['storage-location']}>
                Storage Location
              </span>
              <span className={styles['storage-google']}>Google Drive</span>
            </>
          )}
        </ModalBody>
      </Modal>
    );
  else return <></>;
});

export default DataFilesShowPathModal;
