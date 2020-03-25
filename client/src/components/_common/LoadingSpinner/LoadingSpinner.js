import React from 'react';
import { Spinner } from 'reactstrap';
import PropTypes from 'prop-types';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ placement }) => {
  return (
    <div className="loading-icon" data-testid="loading-spinner">
      <Spinner className={placement} />
    </div>
  );
};
LoadingSpinner.propTypes = {
  placement: PropTypes.string
};
LoadingSpinner.defaultProps = {
  placement: 'section'
};

export default LoadingSpinner;
