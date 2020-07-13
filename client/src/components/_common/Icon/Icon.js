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
  /** Name of icon from icon font (without the (`icon-` prefix) */
  name: PropTypes.string.isRequired,
  /** Additional className for the icon */
  className: PropTypes.string,
  /** A text alternative to the icon (visually hidden) (for accessibility) */
  children: PropTypes.string
};
Icon.defaultProps = {
  className: '',
  children: ''
};

export default Icon;
