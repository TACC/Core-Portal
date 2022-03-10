import React from 'react';
import PropTypes from 'prop-types';

import { SectionHeader } from '_common';

import styles from './SectionTableWrapper.module.css';

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
 * <SectionTableWrapper>
 *   <AnyTableComponent {…} >
 * </SectionTableWrapper>
 * @example
 * // wrap a table, prepend a header, apply a className
 * <SectionTableWrapper
 *   styleName="table-wrapper"
 *   header={<SectionHeader>Heading</SectionHeader>}
 * >
 *   <AnyTableComponent {…} >
 * </SectionTableWrapper>
 * @example
 * // automatically build sub-components, with some customization
 * <SectionTableWrapper
 *   header="Dashboard"
 *   headerStyleName="header"
 *   headerActions={…}
 * >
 *   <AnyTableComponent {…} >
 * </SectionTableWrapper>
 * @example
 * // alternate syntax to automatically build content
 * <SectionTableWrapper
 *   content={
 *     <AnyTableComponent {…} >
 *   }
 * </SectionTableWrapper>
 * @example
 * // manually build sub-components
 * // WARNING: This component's styles are NOT applied to manual sub-components
 * // FAQ: The <SectionHeader> offers auto-built header's layout styles
 * // FAQ: The `o-flex-item-table-wrap` mirrors auto-built content layout fixes
 * <SectionTableWrapper
 *   manualHeader={
 *     <SectionHeader
 *       styleName="…"
 *       actions={…}
 *       isForTable
 *     >
 *       Dashboard
 *     </SectionHeader>
 *   }
 *   manualContent={
 *     <div class="o-flex-item-table-wrap">
 *       <AnyTableComponent {…} >
 *     </div>
 *   }
 * />
 * @example
 * // manually build content (alternate method)
 * // WARNING: This component's styles are NOT applied to manual sub-components
 * // FAQ: The `o-flex-item-table-wrap` mirrors auto-built content layout fixes
 * <SectionTableWrapper manualContent>
 *   <div class="o-flex-item-table-wrap">
 *     <AnyTableComponent {…} >
 *   </div>
 * </SectionTableWrapper>
 */
function SectionTableWrapper({
  className,
  children,
  content,
  contentClassName,
  contentShouldScroll,
  header,
  headerActions,
  headerClassName,
  manualContent,
  manualHeader,
  tagName,
}) {
  let styleName = '';
  const styleNameList = [styles['root']];
  const TagName = tagName;
  const shouldBuildHeader = header || headerClassName || headerActions;

  if (contentShouldScroll) styleNameList.push(styles['should-scroll']);
  if (!manualContent) styleNameList.push(styles['has-wrap']);

  // Do not join inside JSX (otherwise arcane styleName error occurs)
  styleName = styleNameList.join(' ');

  // Allowing ineffectual prop combinations would lead to confusion
  // (unlike <Section>, prop `contentShouldScroll` IS allowed here)
  if (manualContent && (content || contentClassName)) {
    throw new Error(
      'When passing `manualContent`, the following props are ineffectual: `content`, `contentClassName`'
    );
  }
  if (manualHeader && (header || headerClassName || headerActions)) {
    throw new Error(
      'When passing `manualHeader`, the following props are ineffectual: `header`, `headerClassName`, `headerActions`'
    );
  }

  return (
    /* FAQ: Using {styleName} will cause unit test to unexpectedly fail */
    /* SEE: https://github.com/gajus/babel-plugin-react-css-modules/issues/72 */
    <TagName className={`${styleName} ${className}`}>
      {manualHeader ? (
        <>{manualHeader}</>
      ) : (
        shouldBuildHeader && (
          <SectionHeader
            className={`${styles['header']} ${headerClassName}`}
            actions={headerActions}
            isForTable
          >
            {header}
          </SectionHeader>
        )
      )}
      {manualContent ? (
        <>
          {manualContent}
          {children}
        </>
      ) : (
        // This wrapper is the keystone of this component
        // WARNING: When using `manualContent`, user must implement this feature
        // FAQ: A table can NOT be a flex item; <div> wrap is safest solution
        // SEE: https://stackoverflow.com/q/41421512/11817077
        <div className={`o-flex-item-table-wrap ${contentClassName}`}>
          {content}
          {children}
        </div>
      )}
    </TagName>
  );
}
SectionTableWrapper.propTypes = {
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** Alternate way to pass `manualContent` and `content` */
  children: PropTypes.node,
  /** The table content itself (content wrapper built automatically) */
  /* RFE: Ideally, limit this to one `InfiniteScrollTable` or `OtherTable` */
  /* SEE: https://github.com/facebook/react/issues/2979 */
  content: PropTypes.node,
  /** Any additional className(s) for the content element */
  contentClassName: PropTypes.string,
  /** Whether to allow content to scroll */
  contentShouldScroll: PropTypes.bool,
  /** The table header text (header element built automatically) */
  header: PropTypes.node,
  /** Any table actions for the header element */
  headerActions: PropTypes.node,
  /** Any additional className(s) for the header element */
  headerClassName: PropTypes.string,
  /** The table content (built by user) flag or element */
  /* RFE: Ideally, limit these to one relevant `Section[…]` component */
  /* SEE: https://github.com/facebook/react/issues/2979 */
  manualContent: PropTypes.oneOfType([PropTypes.bool, PropTypes.element]),
  /** The section header (built by user) element */
  manualHeader: PropTypes.element,
  /** Override tag of the root element */
  tagName: PropTypes.string,
};
SectionTableWrapper.defaultProps = {
  children: '',
  className: '',
  content: '',
  contentClassName: '',
  contentShouldScroll: false,
  header: '',
  headerActions: '',
  headerClassName: '',
  manualHeader: undefined,
  manualContent: undefined,
  tagName: 'article',
};

export default SectionTableWrapper;
