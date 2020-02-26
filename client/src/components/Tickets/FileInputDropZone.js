import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import './FileInputDropZone.scss';

function FileInputDropZone({ files, onAddFile, onRemoveFile }) {
  const { getRootProps, open, getInputProps } = useDropzone({
    noClick: true,
    maxSize: 3145728,
    onDrop: accepted => {
      accepted.forEach(file => onAddFile(file));
    }
  });

  const hasFiles = files.length > 0;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...getRootProps()} className="dropzone-area">
      <input {...getInputProps()} />
      {!hasFiles && (
        <div className="no-attachment-view">
          <i className="icon-action-upload" />
          <br />
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
                    onRemoveFile(i);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
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
  onRemoveFile: PropTypes.func.isRequired
};

export default FileInputDropZone;
