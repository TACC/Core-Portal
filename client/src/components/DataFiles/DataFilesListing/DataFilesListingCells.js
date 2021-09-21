import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Checkbox, Icon } from '_common';
import { Button } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import './DataFilesListingCells.scss';

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

export const CheckboxCell = React.memo(({ index }) => {
  const selected = useSelector(state =>
    state.files.selected.FilesListing.includes(index)
  );
  return <Checkbox isChecked={selected} />;
});
CheckboxCell.propTypes = {
  index: PropTypes.number.isRequired
};

export const FileNavCell = React.memo(
  ({ system, path, name, format, api, scheme, href, isPublic }) => {
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
          props: { api, scheme, system, path, name, href }
        }
      });
    };

    const basePath = isPublic ? '/public-data' : '/workbench/data';

    return (
      <>
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
  isPublic: PropTypes.bool
};
FileNavCell.defaultProps = {
  isPublic: false
};

export const FileLengthCell = ({ cell }) => {
  const bytes = cell.value;

  return <span>{formatSize(bytes)}</span>;
};
FileLengthCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.number }).isRequired
};

export const LastModifiedCell = ({ cell }) => {
  const timeValue = cell.value;

  return <span>{formatDateTimeFromValue(timeValue)}</span>;
};
LastModifiedCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.string }).isRequired
};

export const FileIcon = ({ format }) => {
  const isFolder = format === 'folder';
  const iconName = isFolder ? 'folder' : 'file';
  const iconLabel = isFolder ? 'Folder' : 'File';

  return <Icon name={iconName}>{iconLabel}</Icon>;
};
FileIcon.propTypes = {
  format: PropTypes.string.isRequired
};

export const FileIconCell = ({ cell }) => {
  return <FileIcon format={cell.value} />;
};
FileIconCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.string }).isRequired
};

export const ViewPathCell = ({ file }) => {
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
    <Button className="btn btn-sm" color="link" onClick={onClick}>
      View Path
    </Button>
  );
};

ViewPathCell.propTypes = {
  file: PropTypes.shape({}).isRequired
};
