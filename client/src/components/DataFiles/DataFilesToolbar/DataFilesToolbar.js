import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faArrowsAlt,
  faCloudDownloadAlt
} from '@fortawesome/free-solid-svg-icons';
import { faCopy, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import './DataFilesToolbar.scss';

export const ToolbarButton = ({ text, icon, onClick, disabled }) => {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className="data-files-toolbar-button"
    >
      <FontAwesomeIcon icon={icon} size="sm" />
      <span className="toolbar-button-text">{text}</span>
    </Button>
  );
};
ToolbarButton.defaultProps = {
  onClick: () => {},
  disabled: true
};
ToolbarButton.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  text: PropTypes.string.isRequired,
  icon: PropTypes.shape({
    prefix: PropTypes.string,
    iconName: PropTypes.string
  }).isRequired
};

const DataFilesToolbar = ({ scheme }) => {
  const dispatch = useDispatch();

  const selectedFiles = useSelector(state =>
    state.files.selected.FilesListing.map(
      i => state.files.listing.FilesListing[i]
    )
  );

  const history = useHistory();
  const location = useLocation();
  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const toggleRenameModal = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'rename',
        props: { selectedFile: selectedFiles[0] }
      }
    });

  const toggleMoveModal = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'move', props: { selectedFiles } }
    });

  const toggleCopyModal = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'copy', props: { selectedFiles } }
    });

  const download = () => {
    dispatch({
      type: 'DATA_FILES_DOWNLOAD',
      payload: { file: selectedFiles[0] }
    });
  };

  const trash = () => {
    dispatch({
      type: 'DATA_FILES_TRASH',
      payload: { file: selectedFiles[0], reloadCallback }
    });
  };

  const canRename = selectedFiles.length === 1 && scheme === 'private';
  const canMove = selectedFiles.length > 0 && scheme === 'private';
  const canCopy = selectedFiles.length > 0 && scheme === 'private';
  const canDownload =
    selectedFiles.length === 1 && selectedFiles[0].format !== 'folder';
  const canTrash = selectedFiles.length === 1 && scheme === 'private';

  return (
    <>
      <div id="data-files-toolbar-button-row">
        <ToolbarButton
          text="Rename"
          onClick={toggleRenameModal}
          icon={faPen}
          disabled={!canRename}
        />
        <ToolbarButton
          text="Move"
          icon={faArrowsAlt}
          onClick={toggleMoveModal}
          disabled={!canMove}
        />
        <ToolbarButton
          text="Copy"
          icon={faCopy}
          onClick={toggleCopyModal}
          disabled={!canCopy}
        />
        <ToolbarButton
          text="Download"
          icon={faCloudDownloadAlt}
          onClick={download}
          disabled={!canDownload}
        />
        <ToolbarButton
          text="Trash"
          icon={faTrashAlt}
          onClick={trash}
          disabled={!canTrash}
        />
      </div>
    </>
  );
};
DataFilesToolbar.propTypes = {
  scheme: PropTypes.string.isRequired
};

export default DataFilesToolbar;
