import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import './DataFilesToolbar.scss';

export const ToolbarButton = ({ text, iconName, onClick, disabled }) => {
  const iconClassName = `icon-action icon-${iconName}`;

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className="data-files-toolbar-button"
    >
      <i className={iconClassName} data-testid="toolbar-icon" />
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
  iconName: PropTypes.string.isRequired
};

const DataFilesToolbar = ({ scheme, api }) => {
  const dispatch = useDispatch();

  const selectedFiles = useSelector(state =>
    state.files.selected.FilesListing.map(
      i => state.files.listing.FilesListing[i]
    )
  );

  const showMakeLink = useSelector(
    state =>
      state.workbench &&
      state.workbench.config.makeLink &&
      api === 'tapis' &&
      (scheme === 'private' || scheme === 'projects')
  );

  const showMakePublic = useSelector(
    state =>
      state.workbench && state.workbench.config.makePublic && api === 'tapis'
  );

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

  const toggleLinkModal = () => {
    dispatch({
      type: 'DATA_FILES_LINK',
      payload: {
        file: selectedFiles[0],
        scheme
      },
      method: 'get'
    });
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'link',
        props: { selectedFile: selectedFiles[0] }
      }
    });
  };

  const toggleMakePublicModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'makePublic',
        props: { selectedFile: selectedFiles[0] }
      }
    });
  };

  const download = () => {
    dispatch({
      type: 'DATA_FILES_DOWNLOAD',
      payload: { file: selectedFiles[0] }
    });
  };

  const trash = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'trash', props: { selectedFiles } }
    });
  };

  const protectedFiles = [
    '.bash_profile',
    '.bashrc',
    '.bash_history',
    '.ssh',
    'authorized_keys',
    '.APPDATA',
    '.Trash'
  ];
  const isProtected = selectedFiles.some(file =>
    protectedFiles.includes(file.name)
  );
  const isPrivate = ['projects', 'private'].includes(scheme);
  const canRename =
    selectedFiles.length === 1 && isPrivate && api === 'tapis' && !isProtected;
  const canMakePublic =
    showMakePublic &&
    !isProtected &&
    selectedFiles.length === 1 &&
    isPrivate &&
    api !== 'googledrive';
  const canMove =
    !isProtected &&
    selectedFiles.length > 0 &&
    isPrivate &&
    api !== 'googledrive';
  const canCopy = selectedFiles.length > 0 && isPrivate;
  const canDownload =
    selectedFiles.length === 1 &&
    selectedFiles[0].format !== 'folder' &&
    api !== 'googledrive';
  const canTrash =
    !isProtected &&
    selectedFiles.length > 0 &&
    isPrivate &&
    api !== 'googledrive';

  return (
    <>
      <div id="data-files-toolbar-button-row">
        <ToolbarButton
          text="Rename"
          onClick={toggleRenameModal}
          iconName="rename"
          disabled={!canRename}
        />
        <ToolbarButton
          text="Move"
          onClick={toggleMoveModal}
          iconName="move"
          disabled={!canMove}
        />
        <ToolbarButton
          text="Copy"
          onClick={toggleCopyModal}
          iconName="copy"
          disabled={!canCopy}
        />
        <ToolbarButton
          text="Download"
          iconName="download"
          onClick={download}
          disabled={!canDownload}
        />
        {showMakeLink && (
          <ToolbarButton
            text="Link"
            iconName="link"
            onClick={toggleLinkModal}
            disabled={!canDownload}
          />
        )}
        {showMakePublic && (
          <ToolbarButton
            text="Make Public"
            iconName="conversation"
            onClick={toggleMakePublicModal}
            disabled={!canMakePublic}
          />
        )}
        <ToolbarButton
          text="Trash"
          iconName="trash"
          onClick={trash}
          disabled={!canTrash}
        />
      </div>
    </>
  );
};
DataFilesToolbar.propTypes = {
  scheme: PropTypes.string.isRequired,
  api: PropTypes.string.isRequired
};

export default DataFilesToolbar;
