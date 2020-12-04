import React from 'react';
import PropTypes from 'prop-types';
import DataFilesListing from '../DataFilesListing/DataFilesListing';

const DataFilesProjectListing = ({ system, path }) => {
  return (
    <DataFilesListing
      api="tapis"
      scheme="projects"
      system={system}
      path={path || '/'}
    />
  );
};

DataFilesProjectListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

export default DataFilesProjectListing;
