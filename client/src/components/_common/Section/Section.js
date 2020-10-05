import React from 'react';
import PropTypes from 'prop-types';

import './Section.module.css';

const JSXpropType = PropTypes.node;

function Section({
  actions,
  shouldScrollContent,
  className,
  content,
  contentClassName,
  header,
  headerClassName,
  // sidebar,
  // sidebarClassName,
  externals,
  messages
}) {
  const messagesMarkup = messages || '';
  const externalsMarkup = externals || '';
  const actionsMarkup = actions || '';
  // const sidebarMarkup = sidebar || '';
  const styleNameList = ['root'];

  if (shouldScrollContent) {
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
      {externalsMarkup}
    </section>
  );
}
Section.propTypes = {
  /** Any page-specific actions (to be placed in the header) */
  actions: JSXpropType,
  /** Whether to allow content to scroll */
  shouldScrollContent: PropTypes.bool,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** The preimary page content */
  content: JSXpropType.isRequired,
  /** Additional className for the content element */
  contentClassName: PropTypes.string,
  /** The page-specific heading */
  header: JSXpropType.isRequired,
  /** Additional className for the header element */
  headerClassName: PropTypes.string,
  // /** The page-specific sidebar */
  // sidebar: JSXpropType.isRequired,
  // /** Additional className for the sidebar element */
  // sidebarClassName: PropTypes.string,
  /** Any that do not render or render outside component layout (ex: modals) */
  externals: JSXpropType,
  /** Any page-specific message (alert, notice, warning, etc) */
  messages: JSXpropType
};
Section.defaultProps = {
  className: '',
  shouldScrollContent: false,
  actions: '',
  externals: '',
  messages: '',
  contentClassName: '',
  headerClassName: ''
  // sidebarClassName: ''
};

export default Section;
