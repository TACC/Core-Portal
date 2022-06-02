import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { CustomMessage, IntroMessage, isKnownIntroMessage } from '_common';
import * as MESSAGES from '../../../constants/messages';

import styles from './SectionMessages.module.css';
import './SectionMessages.css';

/**
 * A list for section messages that supports:
 *
 * - manual messages
 * - manual intro message
 * - automatic intro message
 * - automatic intro message with custom text
 *
 * @example
 * // an automatic intro message (if found), no additional messages
 * <SectionMessages messageComponentName="DASHBOARD" />
 * @example
 * // overwrite text of an automatic intro message, no additional messages
 * <SectionMessages
 *   messageComponentName="DASHBOARD"
 *   introMessageText={`We intro you to the dashboard, ${givenName}`} />
 * @example
 * // define text for a manual intro message, no additional messages
 * <SectionMessages
 *   introMessageText={`We intro you to this page, ${givenName}`}
 * />
 * @example
 * // an automatic intro message (if found), some additional messages
 * <SectionMessages messageComponentName="DASHBOARD">
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 * @example
 * // no automatic intro message, some additional messages
 * <SectionMessages>
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 */
function SectionMessages({
  children,
  className,
  messageComponentName,
  introMessageText,
}) {
  const introMessageContent =
    introMessageText || MESSAGES[messageComponentName];
  const introMessage = introMessageContent && (
    /* FAQ: Alternate message name allows tracking custom message dismissal */
    <IntroMessage
      messageComponentName={messageComponentName || introMessageText}
      canDismiss
    >
      {introMessageContent}
    </IntroMessage>
  );
  const hasMessage =
    isKnownIntroMessage(messageComponentName) || children.length > 0;
  const hasMessageClass = 'has-message';

  const customMessage = (
    <CustomMessage messageComponentName={messageComponentName}></CustomMessage>
  );

  useEffect(() => {
    if (hasMessage) {
      document.body.classList.add(hasMessageClass);
    } else {
      document.body.classList.remove(hasMessageClass);
    }
  }, [hasMessage]);

  return (
    <aside className={`${styles['root']} ${className}`}>
      {introMessage}
      {customMessage}
      {children}
    </aside>
  );
}
SectionMessages.propTypes = {
  /** Component-based message(s) (e.g. <Alert>, <Message>) (intro message found automatically, given `messageComponentName`) */
  children: PropTypes.node,
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** The name of the route section (to search for required message) */
  messageComponentName: PropTypes.string,
  /** Custom intro text (can overwrite message from `messageComponentName`) */
  introMessageText: PropTypes.string,
};
SectionMessages.defaultProps = {
  children: '',
  className: '',
  messageComponentName: '',
  introMessageText: '',
};

export default SectionMessages;
