import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import './FileInputDropZone.css';

function FileInputDropZone({ onFilesChanged }) {
  const [files, setFiles] = useState([]);
  const { getRootProps, open, getInputProps } = useDropzone({
    noClick: true,
    onDrop: accepted => {
      const currentFiles = [...files, ...accepted];
      setFiles(currentFiles);
      onFilesChanged(currentFiles);
    }
  });

  const handleDelete = e => {
    const { id } = e.target.parentElement;
    files.splice(id, 1);
    setFiles([...files]);
    onFilesChanged(files);
  };

  const hasFiles = files.length > 0;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...getRootProps()} className="dropzone-area">
      <input {...getInputProps()} />
      {!hasFiles && (
        <>
          <FontAwesomeIcon
            icon={faCloudUploadAlt}
            style={{ color: '#70707026' }}
            size="8x"
          />
          <br />
          <Button outline onClick={open} className="select-files-button">
            Select File(s)
          </Button>
          <br />
          <strong>
            or
            <br />
            Drag and Drop
          </strong>
          <br />
          <br />
          Max File Size: 100MB
        </>
      )}
      {hasFiles && (
        <div className="attachment-list">
          {files.map((f, i) => (
            <div className="attachment-block" key={[f.name, i].toString()}>
              <span className="d-inline-block text-truncate">{f.name}</span>
              <Button
                color="link"
                className="attachment-remove"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

FileInputDropZone.propTypes = {
  onFilesChanged: PropTypes.func.isRequired
};

export default FileInputDropZone;
