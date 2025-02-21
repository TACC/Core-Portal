import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Button } from '_common';
import getFilePermissions from 'utils/filePermissions';
import { useModal, useSelectedFiles, useFileListing } from 'hooks/datafiles';
import { useSystemRole } from '../DataFilesProjectMembers/_cells/SystemRoleSelector';
import './DataFilesToolbar.scss';
import { useTrash } from 'hooks/datafiles/mutations';

export const ToolbarButton = ({ text, iconName, onClick, disabled }) => {
  const iconClassName = `action icon-${iconName}`;
  return (
    <Button
      iconNameBefore={iconClassName}
      type={text === 'Empty' ? 'primary' : 'secondary'}
      size="small"
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
  const { trash } = useTrash();

  const history = useHistory();
  const location = useLocation();
  const reloadPage = () => {
    history.push(location.pathname);
  };

  const systemList = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  // A project system has different fields than a regular system
  const selectedSystem = systemList.find((sys) => {
    if (params.scheme === 'projects') {
      return params.api === sys.api && sys.scheme === params.scheme;
    } else {
      return sys.system === params.system && sys.scheme === params.scheme;
    }
  });

  const { projectId } = useSelector((state) => state.projects.metadata);

  // defaults to return true if no custom permission check is provided
  const [customPermissionCheck, setCustomPermissionCheck] = useState(
    () => () => true
  );
  const { hasCustomDataFilesToolbarChecks } = useSelector(
    (state) => state.workbench.config
  );
  const { portalName } = useSelector((state) => state.workbench);

  useEffect(() => {
    // dynamically import custom permission check function if it exists

    const loadCustomPermissions = async () => {
      try {
        const module = await import(
          `../../_custom/${portalName.toLowerCase()}/utils/DataFilesToolbar/customFilePermissions.js`
        );
        setCustomPermissionCheck(() => module.default);
      } catch (error) {
        console.error('Error loading custom permission check:', error);
      }
    };

    if (hasCustomDataFilesToolbarChecks && portalName) {
      loadCustomPermissions();
    }
  }, [hasCustomDataFilesToolbarChecks, portalName]);

  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user.username
  );

  const { query: authenticatedUserQuery } = useSystemRole(
    projectId,
    authenticatedUser
  );

  const isGuest = authenticatedUserQuery?.data?.role === 'GUEST';

  const inTrash = useSelector((state) => {
    if (selectedSystem?.scheme === 'projects') {
      return state.files.params.FilesListing.path.startsWith(
        `${state.workbench.config.trashPath}`
      );
    } else {
      // remove leading slash from homeDir value
      const homeDir = selectedSystem?.homeDir?.slice(1);
      if (!homeDir) return false;

      return state.files.params.FilesListing.path.startsWith(
        `${homeDir}/${state.workbench.config.trashPath}`
      );
    }
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

  const hasActiveAllocation = (state) => {
    return (
      state.allocations.portal_alloc ||
      (Array.isArray(state.allocations.active) &&
        state.allocations.active.length > 0)
    );
  };

  const showCompress = !!useSelector(
    (state) =>
      state.workbench.config.extractApp &&
      modifiableUserData &&
      hasActiveAllocation(state)
  );

  const showExtract = !!useSelector(
    (state) =>
      state.workbench.config.compressApp &&
      modifiableUserData &&
      hasActiveAllocation(state)
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

  const toggleLargeDownloadModal = () =>
    toggle({ operation: 'largeDownload', props: {} });

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
      // Checks to see if the file is less than 2 GB; executes the dispatch if true and displays the Globus alert if false
      const maxFileSize = 2 * 1024 * 1024 * 1024;
      if (selectedFiles[0].length < maxFileSize) {
        dispatch({
          type: 'DATA_FILES_DOWNLOAD',
          payload: { file: selectedFiles[0] },
        });
      } else {
        toggleLargeDownloadModal();
      }
    } else {
      toggle({
        operation: 'downloadMessage',
        props: {},
      });
    }
  };

  const homeDir = selectedSystem?.homeDir;

  const trashCallback = useCallback(() => {
    trash({
      destSystem: selectedSystem.system,
      homeDir: homeDir,
      callback: reloadPage,
    });
  }, [selectedFiles, reloadPage, status]);

  const empty = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'empty', props: {} },
    });
  };

  const permissionParams = {
    files: selectedFiles,
    scheme,
    api,
    customPermissionCheck,
  };
  const canDownload = getFilePermissions('download', permissionParams);
  const areMultipleFilesOrFolderSelected = getFilePermissions(
    'areMultipleFilesOrFolderSelected',
    permissionParams
  );
  const canRename = getFilePermissions('rename', permissionParams) && !isGuest;
  const canMove = getFilePermissions('move', permissionParams) && !isGuest;
  const canCopy = getFilePermissions('copy', permissionParams);
  const canTrash = getFilePermissions('trash', permissionParams) && !isGuest;
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
            onClick={!inTrash ? trashCallback : empty}
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
