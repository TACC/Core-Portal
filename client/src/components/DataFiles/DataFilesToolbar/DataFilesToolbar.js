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

const DataFilesToolbar = ({ scheme }) => {
  const dispatch = useDispatch();

  const selectedFiles = useSelector(state =>
    state.files.selected.FilesListing.map(
      i => state.files.listing.FilesListing[i]
    )
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

  const canRename = selectedFiles.length === 1 && scheme === 'private';
  const canMove = selectedFiles.length > 0 && scheme === 'private';
  const canCopy = selectedFiles.length > 0 && scheme === 'private';
  const canDownload =
    selectedFiles.length === 1 && selectedFiles[0].format !== 'folder';
  const canTrash = selectedFiles.length > 0 && scheme === 'private';
  const canCompress = selectedFiles.length > 0 && scheme === 'private';
  const isArchive =
    selectedFiles.length > 0 &&
    (selectedFiles[0].name.includes('.zip') ||
      selectedFiles[0].name.includes('tar.gz'));
  const canExtract = canDownload && isArchive;

  return (
    <>
      <div id="data-files-toolbar-button-row">
        <ToolbarButton
          text="Extract"
          onClick={toggleExtractModal}
          icon={{}}
          disabled={!canExtract}
        />
        <ToolbarButton
          text="Compress"
          onClick={toggleCompressModal}
          icon={{}}
          disabled={!canCompress}
        />
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
  scheme: PropTypes.string.isRequired
};

export default DataFilesToolbar;
