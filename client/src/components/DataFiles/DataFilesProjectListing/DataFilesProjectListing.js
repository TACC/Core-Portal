import React from 'react';
import DataFilesListing from '../DataFilesListing/DataFilesListing';

const DataFilesProjectListing = ({ system, path }) => {
  return (
    <DataFilesListing 
      api="tapis"
      scheme="private"
      system={system}
      path={path || '/'}
    />
  )
}

export default DataFilesProjectListing;