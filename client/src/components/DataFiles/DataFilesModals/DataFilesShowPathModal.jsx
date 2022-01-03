import React, { useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { TextCopyField } from '_common';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs';

const DataFilesShowPathModal = React.memo(() => {
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
        <ModalHeader toggle={toggle} charCode="&#xe912;">
          Pathnames for {file.name}
        </ModalHeader>
        <ModalBody>
          <DataFilesBreadcrumbs
            api={params.api}
            scheme={params.scheme}
            system={params.system}
            path={params.path + file.path || '/'}
            section=""
          />
          <dl>
            {params.api === 'tapis' && definition && (
              <>
                <dt>Storage Host</dt>
                <dd>{definition.storage.host}</dd>
                <dt>Storage Path</dt>
              </>
            )}
            {params.api === 'googledrive' && (
              <>
                <dt>Storage Location</dt>
                <dd>Google Drive</dd>
              </>
            )}
            <dd>
              <TextCopyField
                value={`${definition.storage.rootDir}${file.path}`}
              />
            </dd>
          </dl>
        </ModalBody>
      </Modal>
    );
  else return <></>;
});

export default DataFilesShowPathModal;
