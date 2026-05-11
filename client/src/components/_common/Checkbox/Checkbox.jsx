import React from 'react';
import PropTypes from 'prop-types';

import Icon from '../Icon';

import styles from './Checkbox.module.css';

// RFE: Use (and style) an actual checkbox… `<input type="checkbox">`
//      and still support `DataFilesListingCells`'s button usage (how?)
//      (this would also resolve the aria/lint complications noted below)
const Checkbox = ({ className, isChecked, tabIndex, role, ...props }) => {
  const rootStyleNames = [
    styles['root'],
    isChecked ? styles['is-checked'] : '',
  ].join(' ');

  return (
    <span
      className={`icon-set ${className} ${rootStyleNames}`}
      aria-checked={isChecked}
      // HELP: Should use `tabIndex={0}`, but that causes unable-to-disable
      //       lint error `jsx-ally/no-noninteractive-tabindex`
      //       (need for a `onClick`, `onKeyDown`, et cetera).
      tabIndex={tabIndex}
      role={role}
      // FAQ: `DataFilesListingCells` needs to pass `onClick` and `onKeyDown`,
      //      but adding those props introduces a mistaken jsx-a11y lint error

      {...props}
    >
      <Icon className={styles['check']} name="approved-boxed-reverse" />
      <Icon className={styles['box']} name="boxed" />
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
  role: PropTypes.string,
};
Checkbox.defaultProps = {
  className: '',
  isChecked: false,
  tabIndex: 0,
  role: 'checkbox',
};

export default Checkbox;
