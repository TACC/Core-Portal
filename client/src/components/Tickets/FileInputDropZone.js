import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import './FileInputDropZone.scss';

function RejectedFileMessage({ numberOfFiles }) {
  if (numberOfFiles === 0) {
    return null;
  }

  return (
    <span className="rejected-file-message text-danger">
      One or more of your files exceeds the maximum size for an upload and were
      not attached.
    </span>
  );
}

RejectedFileMessage.propTypes = {
  numberOfFiles: PropTypes.number.isRequired
};

function FileInputDropZone({ files, onAddFile, onRemoveFile, isSubmitted }) {
  const [numberRejectedFiles, setNumberRejectedFiles] = useState(0);

  const { getRootProps, open, getInputProps } = useDropzone({
    noClick: true,
    maxSize: 3145728,
    onDrop: accepted => {
      accepted.forEach(file => onAddFile(file));
      setNumberRejectedFiles(0);
    },
    onDropRejected: rejected => {
      setNumberRejectedFiles(rejected.length);
    }
  });

  const hasFiles = files.length > 0;

  if (isSubmitted && numberRejectedFiles > 0) {
    // reset number of rejected files when files is submited
    setNumberRejectedFiles(0);
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...getRootProps()} className="dropzone-area">
      <input {...getInputProps()} />
      {!hasFiles && (
        <div className="no-attachment-view">
          <i className="icon-action-upload" />
          <br />
          <RejectedFileMessage numberOfFiles={numberRejectedFiles} />
          <Button outline onClick={open} className="select-files-button">
            Select File(s)
          </Button>
          <strong>or</strong>
          <strong>Drag and Drop</strong>
          <br />
          Max File Size: 3MB
        </div>
      )}
      {hasFiles && (
        <div className="attachment-view">
          <div className="attachment-list">
            {files.map((f, i) => (
              <div className="attachment-block" key={[f.name, i].toString()}>
                <span className="d-inline-block text-truncate">{f.name}</span>
                <Button
                  color="link"
                  className="attachment-remove"
                  onClick={() => {
                    setNumberRejectedFiles(0);
                    onRemoveFile(i);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <RejectedFileMessage numberOfFiles={numberRejectedFiles} />
          <Button outline onClick={open} className="select-files-button">
            Select File(s)
          </Button>
        </div>
      )}
    </div>
  );
}

FileInputDropZone.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddFile: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  isSubmitted: PropTypes.bool.isRequired
};

export default FileInputDropZone;
