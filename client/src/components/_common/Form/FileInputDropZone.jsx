/* FP-993: Allow use by DataFilesUploadModal */
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, InlineMessage } from '_common';
import PropTypes from 'prop-types';
import './FileInputDropZone.scss';

/**
 * FileInputDropZone is a component where users can select files via file browser or by
 * drag/drop.  an area to drop files. If `file` property is set then files are listed
 * and user can manage (e.g. delete those files) directly in this component.
 */
function FileInputDropZone({
  files,
  onSetFiles,
  onRejectedFiles,
  maxSize,
  maxSizeMessage,
  onRemoveFile,
  isSubmitted,
}) {
  const [rejectedFiles, setRejectedFiles] = useState([]);

  const { getRootProps, open, getInputProps } = useDropzone({
    noClick: true,
    maxSize,
    onDrop: (accepted) => {
      onSetFiles(accepted);
    },
    onDropRejected: (rejected) => {
      if (onRejectedFiles) {
        onRejectedFiles(rejected);
      } else {
        const newRejectedFiles = rejected.filter(
          (f) => rejectedFiles.filter((rf) => rf.path === f.path).length === 0
        );
        setRejectedFiles([...rejectedFiles, ...newRejectedFiles]);
      }
    },
  });

  const removeFile = (fileIndex) => {
    if (onRemoveFile) {
      onRemoveFile(fileIndex);
    }
  };

  const showFileList = (files && files.length > 0) || rejectedFiles.length > 0;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...getRootProps()} className="dropzone-area">
      <input {...getInputProps()} />
      {!showFileList && (
        <div className="no-attachment-view">
          <i className="icon icon-upload" />
          <br />
          <Button type="secondary" size="medium" onClick={open}>
            Select File(s)
          </Button>
          <strong>or</strong>
          <strong>Drag and Drop</strong>
          <br />
          <p>{maxSizeMessage}</p>
        </div>
      )}
      {showFileList && (
        <div className="attachment-view">
          <div className="attachment-list">
            {rejectedFiles &&
              rejectedFiles.map((f, i) => (
                <div className="attachment-block" key={[f.name, i].toString()}>
                  <span className="d-inline-block text-truncate">{f.name}</span>
                  <InlineMessage type="error">
                    Exceeds File Size Limit
                  </InlineMessage>
                  <Button
                    type="link"
                    onClick={() => {
                      setRejectedFiles([]);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            {files &&
              files.map((f, i) => (
                <div className="attachment-block" key={[f.name, i].toString()}>
                  <span className="d-inline-block text-truncate">{f.name}</span>
                  <Button
                    type="link"
                    onClick={() => {
                      removeFile(i);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
          <Button type="secondary" size="medium" onClick={open}>
            Select File(s)
          </Button>
        </div>
      )}
    </div>
  );
}

FileInputDropZone.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object),
  onSetFiles: PropTypes.func.isRequired,
  onRejectedFiles: PropTypes.func,
  onRemoveFile: PropTypes.func,
  isSubmitted: PropTypes.bool,
  maxSizeMessage: PropTypes.string.isRequired,
  maxSize: PropTypes.number.isRequired,
};

FileInputDropZone.defaultProps = {
  files: null,
  isSubmitted: false,
  onRejectedFiles: null,
  onRemoveFile: null,
};

export default FileInputDropZone;
