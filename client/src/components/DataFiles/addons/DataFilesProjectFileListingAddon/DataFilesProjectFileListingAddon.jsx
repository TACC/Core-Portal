import React from 'react';
import PropTypes from 'prop-types';
import { ProjectFileListingActions } from '_common/ProjectMetadata';

// Default project file-listing toolbar: the generic publication actions.
const DataFilesProjectFileListingAddon = ({ rootSystem, system }) => (
  <ProjectFileListingActions rootSystem={rootSystem} system={system} />
);

DataFilesProjectFileListingAddon.propTypes = {
  rootSystem: PropTypes.string,
  system: PropTypes.string,
};

export default DataFilesProjectFileListingAddon;
