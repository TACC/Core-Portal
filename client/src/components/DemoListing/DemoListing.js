import React, { useState, useEffect, useCallback } from 'react';

const fileStub = [
  { name: 'file1', path: '/path/to/file1' },
  { name: 'file2', path: '/path/to/file2' }
];

export const DemoListing = ({ name }) => {
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
    <div>
      <div>The listing goes here and is named {name}.</div>
      <ul>
        {files.map(file => (
          <li key={file.path}>{file.name}</li>
        ))}
      </ul>
      <button onClick={getMoreFiles}>Add More Files</button>
    </div>
  );
};
