import React from 'react';
import PropTypes from 'prop-types';

import './SectionTable.module.css';

/**
 * A wrapper required (for a table within a `Section[…]` component) that supports:
 *
 * - header (with actions, e.g. links, buttons, form)
 * - change element tag (like `section` instead of `div`)
 *
 * (Without this wrapper, a table will fail to behave inside flexbox-based layouts of `Section[…]` components.)
 *
 * @example
 * // Wrap a table
 * <SectionTable>
 *   <AnyTableComponent />
 * </SectionTable>
 * @example
 * // Wrap a table, prepend a header, apply a className
 * <SectionTable
 *   styleName="table-wrapper"
 *   header={<SectionHeader>Heading</SectionHeader>}
 * >
 *   <AnyTableComponent />
 * </SectionTable>
 */
function SectionTable({ className, children, header }) {
  return (
    <>
      {header}
      <div styleName="root" className={className}>
        {children}
      </div>
    </>
  );
}
SectionTable.propTypes = {
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** Component-based table */
  /* RFE: Ideally, limit this to one `InfiniteScrollTable` or `OtherTable` */
  /* SEE: https://github.com/facebook/react/issues/2979 */
  children: PropTypes.element.isRequired,
  /** The table-specific heading */
  /* RFE: Ideally, limit this to one `SectionHeader` */
  /* SEE: https://github.com/facebook/react/issues/2979 */
  header: PropTypes.element
};
SectionTable.defaultProps = {
  className: '',
  header: <></>
};

export default SectionTable;
