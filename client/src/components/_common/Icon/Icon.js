import React from 'react';
import PropTypes from 'prop-types';
import './Icon.module.css';

const Icon = ({ children, name, className }) => {
  const iconClassName = `icon icon-${name}`;
  const fullClassName = [className, iconClassName].join(' ');

  return (
    <i className={fullClassName} data-testid="icon">
      {children}
    </i>
  );
};
Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.string.isRequired
};
Icon.defaultProps = {
  className: ''
};

export default Icon;
