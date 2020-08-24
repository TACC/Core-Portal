import React from 'react';
import PropTypes from 'prop-types';

import './Section.module.css';

const JSXpropType = PropTypes.any;
// const JSXpropType = PropTypes.oneOfType([
//   PropTypes.string,
//   PropTypes.element,
//   PropTypes.elementType
// ]);

function Section({
  actions,
  shouldScrollContent,
  className,
  content,
  contentClassName,
  header,
  headerClassName,
  externals,
  messages
}) {
  const messagesMarkup = messages || '';
  const externalsMarkup = externals || '';
  const actionsMarkup = actions || '';
  const styleNameList = ['container'];

  if (shouldScrollContent) {
    styleNameList.push('should-scroll');
  }

  return (
    <section styleName={styleNameList.join(' ')} className={className}>
      {messagesMarkup}
      <header styleName="header" className={headerClassName}>
        {header}
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
};

export default Section;
