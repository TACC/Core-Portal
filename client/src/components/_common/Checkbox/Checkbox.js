import React from 'react';
import PropTypes from 'prop-types';

import Icon from '../Icon';

import './Checkbox.module.css';

// RFE: Use (and style) an actual checkbox… `<input type="checkbox">`
//      and still support `DataFilesListingCells`'s button usage (how?)
const Checkbox = ({ className, isChecked, tabIndex, role, ...props }) => {
  const rootStyleNames = ['root', isChecked ? ['is-checked'] : ''].join(' ');

  return (
    <span
      styleName={rootStyleNames}
      className={`icon-set ${className}`}
      aria-checked={isChecked}
      tabIndex={tabIndex}
      role={role}
      // FAQ: `DataFilesListingCells` needs to pass `onClick` and `onKeyDown`,
      //      but adding those props introduces a mistaken jsx-a11y lint error
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <Icon styleName="check" name="approved-boxed-reverse" />
      <Icon styleName="box" name="boxed" />
    </span>
  );
};
Checkbox.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Whether box should be checked */
  isChecked: PropTypes.bool,
  /** Standard HTML attribute [tabindex] */
  tabIndex: PropTypes.number,
  /** Standard HTML attribute [role] */
  role: PropTypes.string
};
Checkbox.defaultProps = {
  className: '',
  isChecked: false,
  tabIndex: 0,
  role: 'checkbox'
};

export default Checkbox;
