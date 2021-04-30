import React from 'react';
import PropTypes from 'prop-types';

import './SectionHeader.module.css';

/**
 * A header for a `Section[…]` component
 *
 * - heading text
 * - actions (e.g. links, buttons, form)
 * - automatic styles or markup for given context (ex: within a form or a table)
 *
 * @example
 * // a section header with heading text (which happens to be also be a link)
 * <SectionHeader>
 *   <a href="…">Hyperlinked Name of Section</a>
 * </SectionHeader>
 * @example
 * // a form header with actions and heading text
 * <SectionHeader
 *   actions={<button type="reset">Reset</button>}
 *   isForForm
 * >
 *   Name of Form
 * </SectionHeader>
 * @example
 * // a table header with actions and heading text
 * <SectionHeader
 *   actions={<input type="search" />}
 *   isForTable
 * >
 *   Name of Table
 * </SectionHeader>
 * @example
 * // a list header (a list can be like a table with no column headers)
 * <SectionHeader isForList>Name of List</SectionHeader>
 */
function SectionHeader({
  actions,
  children,
  className,
  isForForm,
  isForTable,
  isForList
}) {
  let styleName = '';
  const styleNameList = ['root'];
  const HeadingTagName = isForForm || isForTable || isForList ? 'h3' : 'h2';

  if (isForForm) styleNameList.push('for-form');
  if (isForTable) styleNameList.push('for-table');
  if (isForList) styleNameList.push('for-list');

  // Do not join inside JSX (otherwise arcane styleName error occurs)
  styleName = styleNameList.join(' ');

  return (
    <header styleName={styleName} className={className}>
      {children && (
        <HeadingTagName styleName="heading">{children}</HeadingTagName>
      )}
      {actions}
    </header>
  );
}
SectionHeader.propTypes = {
  /** Any actions (buttons, links, forms, etc) */
  actions: PropTypes.node,
  /** The text a.k.a. title */
  children: PropTypes.node,
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** Whether this header is for a form */
  isForForm: PropTypes.bool,
  /** Whether this header is for a table */
  isForTable: PropTypes.bool,
  /** Whether this header is for a list */
  isForList: PropTypes.bool
};
SectionHeader.defaultProps = {
  actions: '',
  className: '',
  children: '',
  isForForm: false,
  isForTable: false,
  isForList: false
};

export default SectionHeader;
