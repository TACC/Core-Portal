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

const DataFilesToolbar = ({ scheme, api, path }) => {
  const dispatch = useDispatch();

  const selectedFiles = useSelector(state =>
    state.files.selected.FilesListing.map(
      i => state.files.listing.FilesListing[i]
    )
  );

  const modifiableUserData =
    api === 'tapis' && scheme !== 'public' && scheme !== 'community';

  const showMove = modifiableUserData;

  const showRename = modifiableUserData;

  const showTrash = modifiableUserData;

  const showDownload = api === 'tapis';

  const showMakeLink = useSelector(
    state =>
      state.workbench &&
      state.workbench.config.makeLink &&
      api === 'tapis' &&
      (scheme === 'private' || scheme === 'projects')
  );

  const showCompress = !!useSelector(
    state => state.workbench.config.extractApp && modifiableUserData
  );

  const showExtract = !!useSelector(
    state => state.workbench.config.compressApp && modifiableUserData
  );

  const showMakePublic = useSelector(
    state =>
      state.workbench &&
      state.workbench.config.makePublic &&
      api === 'tapis' &&
      modifiableUserData
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
    if (canDownload) {
      dispatch({
        type: 'DATA_FILES_DOWNLOAD',
        payload: { file: selectedFiles[0] }
      });
    } else {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'downloadMessage',
          props: {}
        }
      });
    }
  };

  const trash = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'trash', props: { selectedFiles } }
    });
  };

  const permissionParams = { files: selectedFiles, scheme, api };
  const canDownload = getFilePermissions('download', permissionParams);
  const isFolderSelected = getFilePermissions(
    'isFolderSelected',
    permissionParams
  );
  const canRename = getFilePermissions('rename', permissionParams);
  const canMove = getFilePermissions('move', permissionParams);
  const canCopy = getFilePermissions('copy', permissionParams);
  const canTrash = getFilePermissions('trash', permissionParams) && !path.startsWith('.Trash');
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
        {showRename && (
          <ToolbarButton
            text="Rename"
            onClick={toggleRenameModal}
            iconName="rename"
            disabled={!canRename}
          />
        )}
        {showMove && (
          <ToolbarButton
            text="Move"
            onClick={toggleMoveModal}
            iconName="move"
            disabled={!canMove}
          />
        )}
        <ToolbarButton
          text="Copy"
          onClick={toggleCopyModal}
          iconName="copy"
          disabled={!canCopy}
        />
        {showDownload && (
          <ToolbarButton
            text="Download"
            iconName="download"
            onClick={download}
            disabled={!canDownload && !isFolderSelected}
          />
        )}
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
            iconName="publications"
            onClick={toggleMakePublicModal}
            disabled={!canMakePublic}
          />
        )}
        {showTrash && (
          <ToolbarButton
            text="Trash"
            iconName="trash"
            onClick={trash}
            disabled={!canTrash}
          />
        )}
      </div>
    </>
  );
};
DataFilesToolbar.propTypes = {
  scheme: PropTypes.string.isRequired,
  api: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};
export default DataFilesToolbar;
