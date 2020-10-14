import React from 'react';
import PropTypes from 'prop-types';

import { SectionHeader, SectionContent } from '_common';
import SectionMessages from './SectionMessages';
import { LAYOUTS, DEFAULT_LAYOUT } from '../SectionContent';

import './Section.module.css';

/**
 * A section layout structure that supports:
 *
 * - messages (automatically loads welcome message)
 * - header (with actions, e.g. links, buttons, form)
 * - content (that will be arranged in the layout you choose)
 * - manual or automatic sub-components (i.e. header, content)
 *
 * @example
 * // manually build messages, automatically build welcome message
 * <Section
 *   routeName="DASHBOARD"
 *   messages={<>…</>}
 * />
 * @example
 * // automatically build sub-components, with some customization
 * <Section
 *   header="Dashboard"
 *   headerStyleName="header"
 *   headerActions={…}
 *   content={…}
 *   contentStyleName="items"
 *   contentLayoutName="twoColumn"
 * />
 * @example
 * // manually build sub-components
 * // WARNING: This component's styles are NOT applied to manual sub-components
 * <Section
 *   manualHeader={
 *     <SectionHeader
 *       styleName="header"
 *       actions={…}
 *     >
 *       Dashboard
 *     </SectionHeader>
 *   }
 *   manualContent={
 *     <SectionContent
 *       styleName="content"
 *       layoutName="twoColumn">
 *       {…}
 *     </SectionContent>
 *   }
 * />
 */
function Section({
  children,
  className,
  content,
  contentClassName,
  contentLayoutName,
  contentShouldScroll,
  header,
  headerActions,
  headerClassName,
  manualContent,
  manualHeader,
  // manualSidebar,
  // sidebar,
  // sidebarClassName,
  messages,
  messagesClassName,
  routeName
}) {
  const styleNameList = ['root'];
  let styleName = '';

  if (contentShouldScroll) styleNameList.push('should-scroll');

  // Do not join inside JSX (otherwise arcane styleName error occurs)
  styleName = styleNameList.join(' ');

  // Allowing ineffectual prop combinations would lead to confusion
  if (manualContent && (content || contentClassName || contentLayoutName)) {
    throw new Error(
      'When passing `manualContent`, the following props are ineffectual: `content`, `contentClassName`, `contentLayoutName`'
    );
  }
  if (manualHeader && (header || headerClassName || headerActions)) {
    throw new Error(
      'When passing `manualHeader`, the following props are ineffectual: `header`, `headerClassName`, `headerActions`'
    );
  }
  // if (manualSidebar && (sidebar || sidebarClassName)) {
  //   throw new Error(
  //     'When passing `manualSidebar`, the following props are ineffectual: `sidebar`, `sidebarClassName`'
  //   );
  // }

  return (
    <section styleName={styleName} className={className}>
      <SectionMessages
        styleName="messages"
        routeName={routeName}
        className={messagesClassName}
      >
        {messages}
      </SectionMessages>
      {/* {manualSidebar ? (
        <>{manualSidebar}</>
      ) : (
        <Sidebar styleName="sidebar" className={sidebarClassName}>
          {sidebar}
        </Sidebar>
      )} */}
      {manualHeader ? (
        <>{manualHeader}</>
      ) : (
        <SectionHeader
          styleName="header"
          className={headerClassName}
          actions={headerActions}
        >
          {header}
        </SectionHeader>
      )}
      {manualContent ? (
        <>
          {manualContent}
          {children}
        </>
      ) : (
        <SectionContent
          tagName="main"
          styleName="content"
          className={contentClassName}
          layoutName={contentLayoutName || DEFAULT_LAYOUT}
          shouldScroll={contentShouldScroll}
          // shouldDebug
        >
          {content}
        </SectionContent>
      )}
    </section>
  );
}
Section.propTypes = {
  /** Alias for `manualContent` */
  children: PropTypes.node,
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** The section content children (content element built automatically) */
  content: PropTypes.node,
  /** Any additional className(s) for the content element */
  contentClassName: PropTypes.string,
  /** The name of the layout by which to arrange the content children */
  contentLayoutName: PropTypes.oneOf(LAYOUTS.concat('')),
  /** Whether to allow content to scroll */
  contentShouldScroll: PropTypes.bool,
  /** The section header text (header element built automatically) */
  header: PropTypes.node,
  /** Any section actions for the header element */
  headerActions: PropTypes.node,
  /** Any additional className(s) for the header element */
  headerClassName: PropTypes.string,
  /** The section content element (built by user) */
  /* RFE: Ideally, limit these to one relevant `Section[…]` */
  /* SEE: https://github.com/facebook/react/issues/2979 */
  manualContent: PropTypes.element,
  /** The section header element (built by user) */
  manualHeader: PropTypes.element,
  // /** The page-specific sidebar */
  // sidebar: PropTypes.node,
  // /** Additional className for the sidebar element */
  // sidebarClassName: PropTypes.string,
  /** Any component-based message(s) (e.g. <Alert>, <Message>) (welcome message found automatically, given `routeName`) */
  messages: PropTypes.node,
  /** Any additional className(s) for the message list */
  messagesClassName: PropTypes.string,
  /** The name of the route section (to search for a welcome message) */
  routeName: PropTypes.string
};
Section.defaultProps = {
  children: '',
  className: '',
  content: '',
  contentClassName: '',
  contentLayoutName: '',
  contentShouldScroll: false,
  header: '',
  headerActions: '',
  headerClassName: '',
  manualContent: undefined,
  manualHeader: undefined,
  messages: '',
  messagesClassName: '',
  routeName: ''
  // sidebarClassName: ''
};

export default Section;
