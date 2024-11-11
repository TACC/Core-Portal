import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button, Checkbox, Icon, LoadingSpinner } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import './DataFilesListingCells.scss';
import '../../Onboarding/OnboardingStep.module.scss';

import { useSelectedFiles } from 'hooks/datafiles';
import formatSize from 'utils/sizeFormat';
import { formatDateTimeFromValue } from 'utils/timeFormat';

export const CheckboxHeaderCell = () => {
  const { allSelected, selectAll } = useSelectedFiles();
  const handleKeyPress = (e) => e.key === 'enter' && selectAll();
  return (
    <Checkbox
      isChecked={allSelected}
      id="FileCheckboxHeader"
      role="checkbox"
      aria-label="select all folders and files"
      tabIndex={0}
      onClick={selectAll}
      onKeyDown={handleKeyPress}
    />
  );
};

export const CheckboxCell = React.memo(({ index, name, format, disabled }) => {
  const { isSelected } = useSelectedFiles();
  const selected = isSelected(index);
  const itemFormat = format === 'raw' ? 'file' : format;

  return disabled ? (
    <LoadingSpinner placement="inline" />
  ) : (
    <Checkbox
      isChecked={selected}
      id={`FileCheckbox_${index}`}
      role="checkbox"
      aria-label={`select ${itemFormat} ${name}`}
    />
  );
});
CheckboxCell.propTypes = {
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  format: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export const FileNavCell = React.memo(
  ({ system, path, name, format, api, scheme, href, isPublic, length }) => {
    const dispatch = useDispatch();
    const previewCallback = (e) => {
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
          props: { api, scheme, system, path, name, href, length },
        },
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
  isPublic: PropTypes.bool,
  length: PropTypes.number.isRequired,
};
FileNavCell.defaultProps = {
  isPublic: false,
};

export const FileLengthCell = ({ cell }) => {
  const bytes = cell.value;

  return <span>{formatSize(bytes)}</span>;
};
FileLengthCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.number }).isRequired,
};

export const LastModifiedCell = ({ cell }) => {
  const timeValue = cell.value;

  return <span>{formatDateTimeFromValue(timeValue)}</span>;
};
LastModifiedCell.propTypes = {
  cell: PropTypes.shape({ value: PropTypes.string }).isRequired,
};

export const FileIcon = ({ format, path }) => {
  const isFolder = format === 'folder';
  const isTrash =
    path === '/' + useSelector((state) => state.workbench.config.trashPath);
  let iconName = 'file';
  let iconLabel = 'File';
  if (isFolder) {
    iconName = 'folder';
    iconLabel = 'Folder';
    if (isTrash) {
      iconName = 'trash';
      iconLabel = 'Trash';
    }
  }
  return <Icon name={iconName}>{iconLabel}</Icon>;
};
FileIcon.propTypes = {
  format: PropTypes.string.isRequired,
  path: PropTypes.string,
};
FileIcon.defaultProps = {
  path: '',
};

export const FileIconCell = ({ cell }) => {
  return (
    <FileIcon format={cell.row.original.format} path={cell.row.original.path} />
  );
};
FileIconCell.propTypes = {
  cell: PropTypes.shape({
    row: PropTypes.shape({
      original: PropTypes.shape({
        format: PropTypes.string,
        path: PropTypes.string,
      }),
    }),
  }).isRequired,
};

export const ViewPathCell = ({ file }) => {
  const dispatch = useDispatch();
  const onClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'showpath', props: { file } },
    });
  };
  return (
    <Button type="link" onClick={onClick}>
      View Path
    </Button>
  );
};

ViewPathCell.propTypes = {
  file: PropTypes.shape({}).isRequired,
};
