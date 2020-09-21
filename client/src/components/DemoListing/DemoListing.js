import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './DemoListing.module.scss';

const fileStub = [
  { name: 'file1', path: '/path/to/file1' },
  { name: 'file2', path: '/path/to/file2' }
];

const DemoListing = ({ name }) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    setFiles(fileStub);
  }, []);

  const getMoreFiles = useCallback(() => {
    setFiles([
      ...files,
      {
        name: `file ${Math.random()}`,
        path: `${Math.random()}`
      }
    ]);
  });

  return (
    <div styleName="root">
      <div styleName="header">The listing goes here and is named {name}.</div>
      <ul styleName="list">
        {files.map(file => (
          <li styleName="listItem" key={file.path}>
            {file.name}
          </li>
        ))}
      </ul>
      <button styleName="button" type="button" onClick={getMoreFiles}>
        Add More Files
      </button>
    </div>
  );
};
DemoListing.propTypes = {
  name: PropTypes.string
};
DemoListing.defaultProps = {
  name: ''
};

export default DemoListing;
