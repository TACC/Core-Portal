import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Checkbox, Icon, LoadingSpinner } from '_common';
import { Button } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import './DataFilesListingCells.scss';
import '../../Onboarding/OnboardingStep.module.scss'

import formatSize from 'utils/sizeFormat';
import { formatDateTimeFromValue } from 'utils/timeFormat';

export const CheckboxHeaderCell = () => {
  const selected = useSelector(state => state.files.selectAll.FilesListing);
  const listingLength = useSelector(
    state => state.files.listing.FilesListing.length
  );
  const dispatch = useDispatch();
  const toggleSelect = () => {
    listingLength &&
      dispatch({
        type: 'DATA_FILES_TOGGLE_SELECT_ALL',
        payload: { section: 'FilesListing' }
      });
  };
  const handleKeyPress = e => e.key === 'enter' && toggleSelect();
  return (
    <Checkbox
      isChecked={selected}
      role="button"
      tabIndex={0}
      onClick={toggleSelect}
      onKeyDown={handleKeyPress}
    />
  );
};

export const CheckboxCell = React.memo(({ index, trashInProgress }) => {
  const selected = useSelector(state =>
    state.files.selected.FilesListing.includes(index)
  );
  return trashInProgress ? 
    <LoadingSpinner placement="inline"/>
    : <Checkbox isChecked={selected} />;
});
CheckboxCell.propTypes = {
  index: PropTypes.number.isRequired,
  trashInProgress: PropTypes.bool
};

export const FileNavCell = React.memo(
  ({ system, path, name, format, api, scheme, href, isPublic, length, trashInProgress }) => {
    const dispatch = useDispatch();
    const previewCallback = e => {
      e.stopPropagation();
      e.preventDefault();
      if (api === 'googledrive') {
        window.open(href, '_blank');
        return;
      }
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'preview',
          props: { api, scheme, system, path, name, href, length }
        }
      });
    };

    const basePath = isPublic ? '/public-data' : '/workbench/data';

    return (
      <>
        { trashInProgress ? 
        (<div styleName='disabled'>{name}</div>) : 
          <span className="data-files-name">
            <Link
              className="data-files-nav-link"
              to={`${basePath}/${api}/${scheme}/${system}/${path}/`.replace(
                /\/{2,}/g, // Replace duplicate slashes with single slash
                '/'
              )}
              onClick={format !== 'folder' ? previewCallback : null}
            >
              {name}
            </Link>
          </span>
        }
      </>
    );
  }
);
FileNavCell.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  format: PropTypes.string.isRequired,
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  isPublic: PropTypes.bool,
  length: PropTypes.number.isRequired,
  trashInProgress: PropTypes.bool
};
FileNavCell.defaultProps = {
  isPublic: false
};

export const FileLengthCell = ({ cell }) => {
  const bytes = cell.value[0];
  const trashInProgress = cell.value[1];

  return trashInProgress ?
    <div styleName='disabled'>{formatSize(bytes)}</div> 
    : <span>{formatSize(bytes)}</span>;
};
FileLengthCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.array }).isRequired
};

export const LastModifiedCell = ({ cell }) => {
  const timeValue = cell.value[0];
  const trashInProgress = cell.value[1];

  return trashInProgress ? 
    <div styleName="disabled">{formatDateTimeFromValue(timeValue)}</div>
    : <span>{formatDateTimeFromValue(timeValue)}</span>;
};
LastModifiedCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.array }).isRequired
};

export const FileIcon = ({ format, path, trashInProgress }) => {
  const isFolder = format === 'folder';
  const isTrash = path === '/.Trash';
  const iconName = isTrash ? 'trash' : (isFolder ? 'folder' : 'file');
  const iconLabel = isTrash ? 'Trash' : (isFolder ? 'Folder' : 'File');
  return <Icon name={iconName} styleName= {trashInProgress ? 'disabled' : ''}>{iconLabel}</Icon>;
};
FileIcon.propTypes = {
  format: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  trashInProgress: PropTypes.bool
};

export const FileIconCell = ({ cell }) => {
  return <FileIcon format={cell.value[0]} path={cell.value[1]} trashInProgress={cell.value[2]} />;
};
FileIconCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.array }).isRequired
};

export const ViewPathCell = ({ file, trashInProgress }) => {
  const dispatch = useDispatch();
  const onClick = e => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'showpath', props: { file } }
    });
  };
  return (
    <Button className="btn btn-sm" color="link" onClick={onClick} 
    disabled={trashInProgress}>
      View Path
    </Button>
  );
};

ViewPathCell.propTypes = {
  file: PropTypes.shape({}).isRequired,
  trashInProgress: PropTypes.bool
};
