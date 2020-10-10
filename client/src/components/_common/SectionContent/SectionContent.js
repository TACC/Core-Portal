import React from 'react';
import PropTypes from 'prop-types';

import './SectionContent.module.css';

export const LAYOUT_CLASS_MAP = {
  column: 'is-column'
};
export const DEFAULT_LAYOUT = '';
export const LAYOUTS = ['', ...Object.keys(LAYOUT_CLASS_MAP)];

function SectionContent({
  className,
  children,
  layoutName,
  shouldScroll,
  tagName
}) {
  const layoutClass = LAYOUT_CLASS_MAP[layoutName];
  const styleNameList = ['root', layoutClass];
  const TagName = tagName;

  if (shouldScroll) {
    styleNameList.push('should-scroll');
  }

  return (
    <TagName styleName={styleNameList.join(' ')} className={className}>
      {children}
    </TagName>
  );
}
SectionContent.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Content nodes where each node is a block to be laid out */
  children: PropTypes.node.isRequired,
  /** The name of the layout ibyn which to arrange the children nodes */
  layoutName: PropTypes.oneOf(LAYOUTS),
  /** Whether to allow content pane to scroll */
  shouldScroll: PropTypes.bool,
  /** Override tag of the root element */
  tagName: PropTypes.string
};
SectionContent.defaultProps = {
  className: '',
  layoutName: DEFAULT_LAYOUT,
  shouldScroll: false,
  tagName: 'div'
};

export default SectionContent;
