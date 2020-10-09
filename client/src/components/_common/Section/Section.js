import React from 'react';
import PropTypes from 'prop-types';

import './Section.module.css';

function Section({
  actions,
  className,
  content,
  contentClassName,
  contentShouldScroll,
  header,
  headerClassName,
  // sidebar,
  // sidebarClassName,
  messages
}) {
  const messagesMarkup = messages || '';
  const actionsMarkup = actions || '';
  // const sidebarMarkup = sidebar || '';
  const styleNameList = ['root'];

  if (contentShouldScroll) {
    styleNameList.push('should-scroll');
  }

  return (
    <section styleName={styleNameList.join(' ')} className={className}>
      {messagesMarkup}
      {/* <div styleName="sidebar" className={sidebarClassName}>
        {sidebarMarkup}
      </div> */}
      <header styleName="header" className={headerClassName}>
        <h2>{header}</h2>
        {actionsMarkup}
      </header>
      <main styleName="content" className={contentClassName}>
        {content}
      </main>
    </section>
  );
}
Section.propTypes = {
  /** Any page-specific actions (to be placed in the header) */
  actions: PropTypes.node,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** The preimary page content */
  content: PropTypes.node.isRequired,
  /** Additional className for the content element */
  contentClassName: PropTypes.string,
  /** Whether to allow content to scroll */
  contentShouldScroll: PropTypes.bool,
  /** The page-specific heading */
  header: PropTypes.node.isRequired,
  /** Additional className for the header element */
  headerClassName: PropTypes.string,
  // /** The page-specific sidebar */
  // sidebar: PropTypes.node.isRequired,
  // /** Additional className for the sidebar element */
  // sidebarClassName: PropTypes.string,
  /** Any page-specific message (alert, notice, warning, etc) */
  messages: PropTypes.node
};
Section.defaultProps = {
  className: '',
  actions: '',
  messages: '',
  contentClassName: '',
  contentShouldScroll: false,
  headerClassName: ''
  // sidebarClassName: ''
};

export default Section;
