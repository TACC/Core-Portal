import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import DataFilesListing from '../DataFilesListing/DataFilesListing';

const DataFilesProjectFileListing = ({ system, path }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_METADATA',
      payload: system
    });
  }, [system]);
  // const metadata = useSelector(state => state.projects.metadata);

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
