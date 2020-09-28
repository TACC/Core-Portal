import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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

  const [filePath, setFilePath] = useState('FIG1.png');
  const [system, setSystem] = useState('frontera.home.jarosenb');

  const fileDetail = useSelector(state => state.files.fileDetail);
  const dispatch = useDispatch();
  const getFileDetail = useCallback(() => {
    dispatch({
      type: 'FETCH_FILE_DETAIL',
      payload: {
        system,
        filePath
      }
    });
  }, [filePath, system]);

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

      <h1>File Info Getter</h1>
      <div>
        File System:{' '}
        <input value={system} onChange={e => setSystem(e.target.value)} />
        File Path:{' '}
        <input value={filePath} onChange={e => setFilePath(e.target.value)} />
        <button type="button" onClick={getFileDetail}>
          Get File
        </button>
        {fileDetail.loading && <div>Now loading.....</div>}
        <div>
          File Info:
          <ul>
            <li>Name: {fileDetail.value.name}</li>
            <li>UUID: {fileDetail.value.uuid}</li>
            <li>Last Modified: {fileDetail.value.lastModified}</li>
          </ul>
        </div>
      </div>
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
