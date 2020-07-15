import React from 'react';
import PropTypes from 'prop-types';
import './Icon.module.css';

const Icon = ({ children, className, name }) => {
  const iconClassName = `icon icon-${name}`;
  const fullClassName = [className, iconClassName].join(' ');

  return (
    <i className={fullClassName} data-testid="icon">
      {children}
    </i>
  );
};
Icon.propTypes = {
  /** A text alternative to the icon (for accessibility) */
  children: PropTypes.string,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Name of icon from icon font (without the (`icon-` prefix) */
  name: PropTypes.string.isRequired
};
Icon.defaultProps = {
  children: '',
  className: ''
};

export default Icon;
