import React from 'react';
import PropTypes from 'prop-types';

import { WelcomeMessage } from '_common';
import * as MESSAGES from '../../../constants/welcomeMessages';
import './Section.module.css';

function SectionMessage({ children, routeName }) {
  const output = [];
  const messageText = MESSAGES[routeName];

  if (messageText) {
    output.push(
      <WelcomeMessage messageName={routeName}>{messageText}</WelcomeMessage>
    );
  }
  if (children) {
    output.push(children);
  }

  return output;
}
SectionMessage.propTypes = {
  /** Prepared message markup (do not just pass a string) */
  children: PropTypes.node.isRequired,
  /** The name of the route section (to search for required welcome message) */
  routeName: PropTypes.string.isRequired
};

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
  message,
  routeName
}) {
  const styleNameList = ['root'];

  if (contentShouldScroll) {
    styleNameList.push('should-scroll');
  }

  return (
    <section styleName={styleNameList.join(' ')} className={className}>
      <SectionMessage routeName={routeName}>{message}</SectionMessage>
      {/* <div styleName="sidebar" className={sidebarClassName}>
        {sidebar}
      </div> */}
      <header styleName="header" className={headerClassName}>
        <h2>{header}</h2>
        {actions}
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
  /** Any page-specific message(s) (alert, notice, warning, etc) */
  message: PropTypes.node,
  /** The name of the route section (to search for required welcome message) */
  routeName: PropTypes.string.isRequired
};
Section.defaultProps = {
  actions: '',
  className: '',
  contentClassName: '',
  contentShouldScroll: false,
  headerClassName: '',
  // sidebarClassName: ''
  message: ''
};

export default Section;
