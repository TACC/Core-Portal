import React from 'react';
import PropTypes from 'prop-types';
import DataFilesListing from '../DataFilesListing/DataFilesListing';

const DataFilesProjectFileListing = ({ system, path }) => {
  return (
    <DataFilesListing
      api="tapis"
      scheme="projects"
      system={system}
      path={path || '/'}
    />
  );
};

DataFilesProjectFileListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

export default DataFilesProjectFileListing;
