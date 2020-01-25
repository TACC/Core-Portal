import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const DataFilesMkdirModal = () => {
  const dispatch = useDispatch();
  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );
  const isOpen = useSelector(state => state.files.modals.mkdir);
  const [dirname, setDirname] = useState('');
  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'mkdir', props: {} }
    });
  };

  const onClosed = () => setDirname('');

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const mkdir = () =>
    dispatch({
      type: 'DATA_FILES_MKDIR',
      payload: {
        api: params.api,
        scheme: params.scheme,
        system: params.system,
        path: params.path || '/',
        dirname,
        reloadCallback: reloadPage
      }
    });

  return (
    <>
      <Modal size="lg" isOpen={isOpen} toggle={toggle} onClosed={onClosed}>
        <ModalHeader toggle={toggle}>
          Creating folder in: {params.path}
        </ModalHeader>
        <ModalBody>
          Enter the new name for the new folder:
          <input
            onChange={e => setDirname(e.target.value)}
            className="form-control"
            value={dirname}
          />
        </ModalBody>
        <ModalFooter>
          <Button id="data-files-add" color="primary" onClick={mkdir}>
            Create Folder{' '}
          </Button>
          <Button color="secondary" onClick={toggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default DataFilesMkdirModal;
