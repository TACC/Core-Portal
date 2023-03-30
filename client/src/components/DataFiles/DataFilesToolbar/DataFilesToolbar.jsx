import React, { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Button } from '_common';
import getFilePermissions from 'utils/filePermissions';
import { useModal, useSelectedFiles, useFileListing } from 'hooks/datafiles';
import './DataFilesToolbar.scss';

export const ToolbarButton = ({ text, iconName, onClick, disabled }) => {
  const iconClassName = `action icon-${iconName}`;
  return (
    <Button
      iconNameBefore={iconClassName}
      type={text === 'Empty' ? 'primary' : 'secondary'}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </Button>
  );
};
ToolbarButton.defaultProps = {
  onClick: () => {},
  disabled: true,
  className: '',
};
ToolbarButton.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  text: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  className: PropTypes.string,
};

const DataFilesToolbar = ({ scheme, api }) => {
  const dispatch = useDispatch();
  const { toggle } = useModal();
  const { selectedFiles } = useSelectedFiles();
  const { params } = useFileListing('FilesListing');

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const systemList = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  const selectedSystem = systemList.find(
    (sys) => sys.system === params.system && sys.scheme === params.scheme
  );

  const inTrash = useSelector((state) => {
    // remove leading slash from homeDir value
    const homeDir = selectedSystem?.homeDir.slice(1);

    return state.files.params.FilesListing.path.startsWith(
      `${homeDir}/${state.workbench.config.trashPath}`
    );
  });

  const trashedFiles = useSelector((state) =>
    inTrash ? state.files.listing.FilesListing : []
  );

  const status = useSelector((state) => state.files.operationStatus.trash);

  const modifiableUserData =
    api === 'tapis' && scheme !== 'public' && scheme !== 'community';

  const showMove = modifiableUserData;

  const showRename = modifiableUserData;

  const showTrash = modifiableUserData;

  const showDownload = api === 'tapis';

  const showMakeLink = useSelector(
    (state) =>
      state.workbench &&
      state.workbench.config.makeLink &&
      api === 'tapis' &&
      (scheme === 'private' || scheme === 'projects')
  );

  const showCompress = !!useSelector(
    (state) => state.workbench.config.extractApp && modifiableUserData
  );

  const showExtract = !!useSelector(
    (state) => state.workbench.config.compressApp && modifiableUserData
  );

  const showMakePublic = useSelector(
    (state) =>
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
        scheme,
      },
      method: 'get',
    });
    toggle({
      operation: 'link',
      props: { selectedFile: selectedFiles[0] },
    });
  };
  const download = () => {
    if (canDownload) {
      dispatch({
        type: 'DATA_FILES_DOWNLOAD',
        payload: { file: selectedFiles[0] },
      });
    } else {
      toggle({
        operation: 'downloadMessage',
        props: {},
      });
    }
  };

  const trash = useCallback(() => {
    const filteredSelected = selectedFiles.filter(
      (f) => status[f.system + f.path] !== 'SUCCESS'
    );

    dispatch({
      type: 'DATA_FILES_TRASH',
      payload: {
        src: filteredSelected,
        homeDir: selectedSystem?.homeDir || '',
        reloadCallback: reloadPage,
      },
    });
  }, [selectedFiles, selectedSystem, reloadPage]);

  const empty = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'empty', props: {} },
    });
  };

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
  const canEmpty = trashedFiles.length > 0;

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
            text={!inTrash ? 'Trash' : 'Empty'}
            iconName="trash"
            onClick={!inTrash ? trash : empty}
            disabled={!inTrash ? !canTrash : !canEmpty}
            className={!inTrash ? '' : 'is-empty'}
          />
        )}
      </div>
    </>
  );
};
DataFilesToolbar.propTypes = {
  scheme: PropTypes.string.isRequired,
  api: PropTypes.string.isRequired,
};
export default DataFilesToolbar;
