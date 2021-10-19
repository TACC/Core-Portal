import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { IntroMessage, isKnownIntroMessage } from '_common';
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
 * <SectionMessages introMessageName="DASHBOARD" />
 * @example
 * // overwrite text of an automatic intro message, no additional messages
 * <SectionMessages
 *   introMessageName="DASHBOARD"
 *   introMessageText={`We intro you to the dashboard, ${givenName}`} />
 * @example
 * // define text for a manual intro message, no additional messages
 * <SectionMessages
 *   introMessageText={`We intro you to this page, ${givenName}`}
 * />
 * @example
 * // an automatic intro message (if found), some additional messages
 * <SectionMessages introMessageName="DASHBOARD">
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
  introMessageName,
  introMessageText,
}) {
  const introMessageContent = introMessageText || MESSAGES[introMessageName];
  const introMessage = introMessageContent && (
    /* FAQ: Alternate message name allows tracking custom message dismissal */
    <IntroMessage messageName={introMessageName || introMessageText}>
      {introMessageContent}
    </IntroMessage>
  );
  const hasMessage =
    isKnownIntroMessage(introMessageName) || children.length > 0;
  const hasMessageClass = 'has-message';

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
      {children}
    </aside>
  );
}
SectionMessages.propTypes = {
  /** Component-based message(s) (e.g. <Alert>, <Message>) (intro message found automatically, given `introMessageName`) */
  children: PropTypes.node,
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** The name of the route section (to search for required intro message) */
  introMessageName: PropTypes.string,
  /** Custom intro text (can overwrite message from `introMessageName`) */
  introMessageText: PropTypes.string,
};
SectionMessages.defaultProps = {
  children: '',
  className: '',
  introMessageName: '',
  introMessageText: '',
};

export default SectionMessages;
