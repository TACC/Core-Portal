import React from 'react';
import PropTypes from 'prop-types';
import './Icon.module.css';

const Icon = ({ name, className }) => {
  const iconClassName = `icon-${name}`;
  const fullClassName = [className, iconClassName].join(' ');

  return <i className={fullClassName} data-testid="icon" />;
};
Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string
};
Icon.defaultProps = {
  className: ''
};

export default Icon;
