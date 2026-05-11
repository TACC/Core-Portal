import React from 'react';
import PropTypes from 'prop-types';

/* Used by `styleNameList` implicitely via CSS Modules */

import styles from './SectionContent.module.css';
import layoutStyles from './SectionContent.layouts.module.css';

/**
 * Map of layout names to CSS classes
 * @enum {number}
 */
export const LAYOUT_CLASS_MAP = {
  /**
   * Each child element is a full-height column with a flexible width
   *
   * CAVEAT: No sidebar styles provided (until a <SectionSidebar> exists)
   */
  hasSidebar: layoutStyles['has-sidebar'],
  /**
   * Each child element is a flexible block inside one full-height column
   */
  oneColumn: layoutStyles['one-column'],
  /**
   * Each child element is a panel stacked into two full-height columns
   * (on narrow screens, there is only one column)
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Columns
   */
  twoColumn: layoutStyles['two-column'],
  /**
   * Like `twoColumn`, but supports unequal column widths (assembly required)
   * (when there are two columns, the widths are: large on left, small on right)
   * (when there are three columns, the widths are still equal)
   * @see https://stackoverflow.com/a/29156418/11817077
   * @tutorial SectionContent.layouts.unequalColumns
   */
  twoColumnUnequal: `${layoutStyles['two-column']} ${layoutStyles['with-unequal-columns']}`,
  /**
   * Each child element is a panel stacked into two or more full-height columns
   * (on short wide screens, there are three equal-width columns)
   * (on tall wide screens, there are two equal-width columns)
   * (on narrow screens, there is only one column)
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Columns
   */
  multiColumn: layoutStyles['multi-column'],
  /**
   * Like `multiColumn`, but supports unequal column widths (assembly required)
   * (when there are two columns, the widths are: large on left, small on right)
   * (when there are three columns, the widths are still equal)
   * @see https://stackoverflow.com/a/29156418/11817077
   * @tutorial SectionContent.layouts.unequalColumns
   */
  multiColumnUnequal: `${layoutStyles['multi-column']} ${layoutStyles['with-unequal-columns']}`,
  /**
   * Like `multiColumn`, but fills columns left to right instead of
   * top to bottom.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/column-fill
   */
  balance: `${layoutStyles['multi-column']} ${layoutStyles['balance']}`,
  /**
   * Like `balance`, but supports unequal column widths (assembly required)
   * (when there are two columns, the widths are: large on left, small on right)
   * (when there are three columns, the widths are still equal)
   * @see https://stackoverflow.com/a/29156418/11817077
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/column-fill
   * @tutorial SectionContent.layouts.unequalColumns
   */
  balanceUnequal: `${layoutStyles['multi-column']} ${layoutStyles['balance']} ${layoutStyles['with-unequal-columns']}`,
};
export const DEFAULT_LAYOUT = 'hasSidebar';
export const LAYOUTS = [...Object.keys(LAYOUT_CLASS_MAP)];

/**
 * A content panel wrapper that supports:
 *
 * - lay out panels (based on layout name and panel position)
 * - change element tag (like `section` instead of `div`)
 * - scroll root element (overflow of panel content is not managed)
 * - debug layout (via color-coded panels)
 *
 * @example
 * // features: lay out panels, change tag, allow content scroll, color-coded
 * <SectionContent
 *   layoutName="oneColumn"
 *   tagName="main"
 *   shouldScroll
 * >
 *   <div>Thing 1</div>
 *   <div>Thing 2</div>
 *   <div>Thing 3</div>
 * </SectionContent>
 */
function SectionContent({
  className,
  children,
  layoutName,
  shouldScroll,
  tagName,
}) {
  let styleName = '';
  const styleNameList = [styles['root'], layoutStyles['root']];
  const layoutClass = LAYOUT_CLASS_MAP[layoutName];
  const TagName = tagName;

  if (shouldScroll) styleNameList.push(styles['should-scroll']);
  if (layoutClass) styleNameList.push(layoutClass);

  // Do not join inside JSX (otherwise arcane styleName error occurs)
  styleName = styleNameList.join(' ');

  return <TagName className={`${className} ${styleName}`}>{children}</TagName>;
}
SectionContent.propTypes = {
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** Content nodes where each node is a block to be laid out */
  children: PropTypes.node.isRequired,
  /** The name of the layout by which to arrange the nodes */
  layoutName: PropTypes.oneOf(LAYOUTS).isRequired,
  /** Whether to allow root element to scroll */
  shouldScroll: PropTypes.bool,
  /** Override tag of the root element */
  tagName: PropTypes.string,
};
SectionContent.defaultProps = {
  className: '',
  shouldScroll: false,
  tagName: 'div',
};

export default SectionContent;
