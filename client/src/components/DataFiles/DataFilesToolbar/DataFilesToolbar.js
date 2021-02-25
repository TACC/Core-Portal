import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import getFilePermissions from 'utils/filePermissions';
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

  const showCompress = !!useSelector(
    state => state.workbench.config.extractApp
  );

  const showExtract = !!useSelector(
    state => state.workbench.config.compressApp
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

  const toggleCompressModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'compress', props: { selectedFiles } }
    });
  };

  const toggleExtractModal = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'extract',
        props: { selectedFile: selectedFiles[0] }
      }
    });
  };

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

  const permissionParams = { files: selectedFiles, scheme, api };
  const canRename = getFilePermissions('rename', permissionParams);
  const canMove = getFilePermissions('move', permissionParams);
  const canCopy = getFilePermissions('copy', permissionParams);
  const canDownload = getFilePermissions('download', permissionParams);
  const canTrash = getFilePermissions('trash', permissionParams);
  const canCompress = getFilePermissions('compress', permissionParams);
  const canExtract = getFilePermissions('extract', permissionParams);
  const canMakePublic =
    showMakePublic && getFilePermissions('public', permissionParams);
  return (
    <>
      <div id="data-files-toolbar-button-row">
        {showExtract && (
          <ToolbarButton
            text="Extract"
            onClick={toggleExtractModal}
            iconName="extract"
            disabled={!canExtract}
          />
        )}
        {showCompress && (
          <ToolbarButton
            text="Compress"
            onClick={toggleCompressModal}
            iconName="compress"
            disabled={!canCompress}
          />
        )}
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
