import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import getFilePermissions from 'utils/filePermissions';
import { useModal, useSelectedFiles } from 'hooks/datafiles';
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
  const { toggle } = useModal();
  const { selectedFiles } = useSelectedFiles();
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
    toggle({ operation: 'rename', props: { selectedFile: selectedFiles[0] } });

  const toggleMoveModal = () =>
    toggle({ operation: 'move', props: { selectedFiles } });

  const toggleCopyModal = () =>
    toggle({ operation: 'copy', props: { selectedFiles, canMakePublic } });

  const toggleCompressModal = () =>
    toggle({ operation: 'compress', props: { selectedFiles } });

  const toggleExtractModal = () =>
    toggle({ operation: 'extract', props: { selectedFile: selectedFiles[0] } });

  const toggleLinkModal = () => {
    dispatch({
      type: 'DATA_FILES_LINK',
      payload: {
        file: selectedFiles[0],
        scheme
      },
      method: 'get'
    });
    toggle({
      operation: 'link',
      props: { selectedFile: selectedFiles[0] }
    });
  };
  const download = () => {
    if (canDownload) {
      dispatch({
        type: 'DATA_FILES_DOWNLOAD',
        payload: { file: selectedFiles[0] }
      });
    } else {
      toggle({
        operation: 'downloadMessage',
        props: {}
      });
    }
  };

  const trash = () => toggle({ operation: 'trash', props: { selectedFiles } });

  const permissionParams = { files: selectedFiles, scheme, api };
  const canDownload = getFilePermissions('download', permissionParams);
  const areMultipleFilesOrFolderSelected = getFilePermissions(
    'areMultipleFilesOrFolderSelected',
    permissionParams
  );
  const canRename = getFilePermissions('rename', permissionParams);
  const canMove = getFilePermissions('move', permissionParams);
  const canCopy = getFilePermissions('copy', permissionParams);
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
            disabled={!canDownload && !areMultipleFilesOrFolderSelected}
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
  api: PropTypes.string.isRequired
};
export default DataFilesToolbar;
