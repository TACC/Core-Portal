import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';

const DataFilesShowPathModal = React.memo(() => {
  const history = useHistory();
  const location = useLocation();

  const dispatch = useDispatch();
  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const modalParams = useSelector(
    state => state.files.params.modal,
    shallowEqual
  );

  const files = useSelector(state => state.files.listing.modal, shallowEqual);
  const isOpen = useSelector(state => state.files.modals.showpath);
  const status = useSelector(
    state => state.files.operationStatus.copy,
    shallowEqual
  );
  const [disabled, setDisabled] = useState(false);

  const selectedFiles = useSelector(
    state =>
      state.files.selected.FilesListing.map(i => ({
        ...state.files.listing.FilesListing[i],
        id: uuidv4()
      })),
    () => true
  );

  const definition = useSelector(state => {
    if (!selectedFiles[0]) {
      return null;
    }
    const matching = state.systems.systemList.find(sys => sys.system === selectedFiles[0].system);
    if (!matching) {
      return null;
    }
    return matching.definition;
  });

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
    setDisabled(false);
  };

  return definition ? (
    <Modal
      isOpen={isOpen && definition}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      size="xl"
      className="dataFilesModal"
    >
      <ModalHeader>Show Path</ModalHeader>
      <ModalBody style={{ height: '70vh' }}>
        <div className="row h-100">
          <div className="col-md-6 d-flex flex-column">
            {/* Table of selected files */}
            <div className="dataFilesModalColHeader"></div>
            <DataFilesBreadcrumbs
              api={params.api}
              scheme={params.scheme}
              system={params.system}
              path={params.path + selectedFiles[0].path || '/'}
              section=""
            />
            <dl>
              <dt>Storage Host</dt>
              <dd>{definition.storage.host}</dd>
              <dt>Storage Path</dt>
              <dd>{definition.storage.rootDir}{selectedFiles[0].path}</dd>
            </dl>
          </div>
        </div>
      </ModalBody>
    </Modal>
  ) : null;
});

export default DataFilesShowPathModal;
