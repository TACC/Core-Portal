import React from 'react';
import PropTypes from 'prop-types';
import DataFilesBreadcrumbs from '../DataFilesBreadcrumbs/DataFilesBreadcrumbs.jsx';
import BreadcrumbsDropdown from '../DataFilesDropdown/DataFilesDropdown.jsx';
import styles from './CombinedBreadcrumbs.module.scss';

const CombinedBreadcrumbs = (props) => {
  return (
    <div className={styles['combined-breadcrumbs']}>
      <BreadcrumbsDropdown {...props} />
      <DataFilesBreadcrumbs {...props} />
    </div>
  );
};

CombinedBreadcrumbs.propTypes = {
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  isPublic: PropTypes.bool,
  basePath: PropTypes.string,
  className: PropTypes.string,
};

CombinedBreadcrumbs.defaultProps = {
  isPublic: false,
  className: '',
};

export default CombinedBreadcrumbs;
