import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';

import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';

const DataFilesShowPathModal = React.memo(() => {
  const dispatch = useDispatch();
  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const { file } = useSelector(state => state.files.modalProps.showpath);

  const definition = useSelector(state => {
    if (!file) {
      return null;
    }
    const matching = state.systems.systemList.find(
      sys => sys.system === file.system
    );
    if (!matching) {
      return null;
    }
    return matching.definition;
  });

  const isOpen = useSelector(
    state => state.files.modals.showpath && definition
  );

  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'showpath', props: {} }
    });

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' }
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
  };

  return definition ? (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Pathnames for {file.name}</ModalHeader>
      <ModalBody>
        <DataFilesBreadcrumbs
          api={params.api}
          scheme={params.scheme}
          system={params.system}
          path={params.path + file.path || '/'}
          section=""
        />
        <dl>
          <dt>Storage Host</dt>
          <dd>{definition.storage.host}</dd>
          <dt>Storage Path</dt>
          <dd>
            {definition.storage.rootDir}
            {file.path}
          </dd>
        </dl>
      </ModalBody>
    </Modal>
  ) : null;
});

export default DataFilesShowPathModal;
