import React from 'react';
import PropTypes from 'prop-types';

import { SectionHeader } from '_common';

import './SectionTable.module.css';

/**
 * A wrapper required (for a table within a `Section[…]` component) that supports:
 *
 * - header (with actions, e.g. links, buttons, form)
 * - change element tag (like `section` instead of `div`)
 * - manual or automatic sub-components (i.e. header)
 *
 * (Without this wrapper, a table will fail to behave inside flexbox-based layouts of `Section[…]` components.)
 *
 * @example
 * // wrap a table (no header)
 * <SectionTable>
 *   <AnyTableComponent />
 * </SectionTable>
 * @example
 * // wrap a table, prepend a header, apply a className
 * <SectionTable
 *   styleName="table-wrapper"
 *   header={<SectionHeader>Heading</SectionHeader>}
 * >
 *   <AnyTableComponent />
 * </SectionTable>
 * @example
 * // automatically build sub-components, with some customization
 * <SectionTable
 *   header="Dashboard"
 *   headerStyleName="header"
 *   headerActions={…}
 * >
 *   <AnyTableComponent />
 * </SectionTable>
 * @example
 * // manually build sub-components
 * // WARNING: This component's styles are NOT applied to manual sub-components
 * <SectionTable
 *   manualHeader={
 *     <SectionHeader
 *       styleName="header"
 *       actions={…}
 *       isForTable
 *     >
 *       Dashboard
 *     </SectionHeader>
 *   }
 * >
 *   <AnyTableComponent />
 * </SectionTable>
 */
function SectionTable({
  className,
  children,
  header,
  headerActions,
  headerClassName,
  manualHeader,
  shouldScroll,
  tagName
}) {
  let styleName = '';
  const styleNameList = ['root'];
  const shouldBuildHeader = header || headerActions;
  const TagName = tagName;

  if (shouldScroll) styleNameList.push('should-scroll');

  // Do not join inside JSX (otherwise arcane styleName error occurs)
  styleName = styleNameList.join(' ');

  // Allowing ineffectual prop combinations would lead to confusion
  if (manualHeader && (header || headerClassName || headerActions)) {
    throw new Error(
      'When passing `manualHeader`, the following props are ineffectual: `header`, `headerClassName`, `headerActions`'
    );
  }

  return (
    <TagName styleName={styleName} className={className}>
      {manualHeader ? (
        <>{manualHeader}</>
      ) : (
        <>
          {shouldBuildHeader && (
            <SectionHeader
              styleName="header"
              className={headerClassName}
              actions={headerActions}
              isForTable
            >
              {header}
            </SectionHeader>
          )}
        </>
      )}
      {/* This wrapper is the keystone of this component */}
      {/* FAQ: A table can NOT be a flex item; <div> wrap is safest solution */}
      {/* SEE: https://stackoverflow.com/q/41421512/11817077 */}
      <div styleName="table-wrap">{children}</div>
    </TagName>
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
  header: PropTypes.node,
  /** Any section actions for the header element */
  headerActions: PropTypes.node,
  /** Any additional className(s) for the header element */
  headerClassName: PropTypes.string,
  /** The section header element (built by user) */
  /* RFE: Ideally, limit this to one `SectionHeader` */
  /* SEE: https://github.com/facebook/react/issues/2979 */
  manualHeader: PropTypes.element,
  /** Whether to allow wrapper element to scroll */
  shouldScroll: PropTypes.bool,
  /** Override tag of the root element */
  tagName: PropTypes.string
};
SectionTable.defaultProps = {
  className: '',
  header: '',
  headerActions: '',
  headerClassName: '',
  manualHeader: undefined,
  shouldScroll: false,
  tagName: 'article'
};

export default SectionTable;
