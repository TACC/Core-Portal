import React from 'react';
import PropTypes from 'prop-types';
import './Icon.module.css';

const Icon = ({ children, className, dataTestid, name }) => {
  const iconClassName = `icon icon-${name}`;
  // FAQ: The conditional avoids an extra space in class attribute value
  const fullClassName = className
    ? [className, iconClassName].join(' ')
    : iconClassName;
  const label = children;

  return (
    <i
      className={fullClassName}
      role="img"
      aria-label={label}
      data-testid={dataTestid}
    />
  );
};
Icon.propTypes = {
  /** A text alternative to the icon (for accessibility) */
  children: PropTypes.string,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** ID for test case element selection */
  dataTestid: PropTypes.string,
  /** Name of icon from icon font (without the (`icon-` prefix) */
  name: PropTypes.string.isRequired,
};
Icon.defaultProps = {
  children: '',
  className: '',
  dataTestid: undefined,
};

export default Icon;
