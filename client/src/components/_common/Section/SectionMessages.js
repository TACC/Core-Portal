import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { WelcomeMessage, isKnownWelcomeMessage } from '_common';
import * as MESSAGES from '../../../constants/messages';

import './SectionMessages.module.css';
import './SectionMessages.css';

/**
 * A list for section messages that supports:
 *
 * - manual messages
 * - manual welcome message
 * - automatic welcome message
 * - automatic welcome message with custom text
 *
 * @example
 * // an automatic welcome message (if found), no additional messages
 * <SectionMessages welcomeMessageName="DASHBOARD" />
 * @example
 * // overwrite text of an automatic welcome message, no additional messages
 * <SectionMessages
 *   welcomeMessageName="DASHBOARD"
 *   welcomeMessageText={`We welcome you to the dashboard, ${givenName}`} />
 * @example
 * // define text for a manual welcome message, no additional messages
 * <SectionMessages
 *   welcomeMessageText={`We welcome you to this page, ${givenName}`}
 * />
 * @example
 * // an automatic welcome message (if found), some additional messages
 * <SectionMessages welcomeMessageName="DASHBOARD">
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 * @example
 * // no automatic welcome message, some additional messages
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
  welcomeMessageName,
  welcomeMessageText
}) {
  const welcomeMessageContent =
    welcomeMessageText || MESSAGES[welcomeMessageName];
  const welcomeMessage = welcomeMessageContent && (
    /* FAQ: Alternate message name allows tracking custom message dismissal */
    <WelcomeMessage messageName={welcomeMessageName || welcomeMessageText}>
      {welcomeMessageContent}
    </WelcomeMessage>
  );
  const hasMessage =
    isKnownWelcomeMessage(welcomeMessageName) || children.length > 0;
  const hasMessageClass = 'has-message';

  useEffect(() => {
    if (hasMessage) {
      document.body.classList.add(hasMessageClass);
    } else {
      document.body.classList.remove(hasMessageClass);
    }
  }, [hasMessage]);

  return (
    <aside styleName="root" className={className}>
      {welcomeMessage}
      {children}
    </aside>
  );
}
SectionMessages.propTypes = {
  /** Component-based message(s) (e.g. <Alert>, <Message>) (welcome message found automatically, given `welcomeMessageName`) */
  children: PropTypes.node,
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** The name of the route section (to search for required welcome message) */
  welcomeMessageName: PropTypes.string,
  /** Custom welcome text (can overwrite message from `welcomeMessageName`) */
  welcomeMessageText: PropTypes.string
};
SectionMessages.defaultProps = {
  children: '',
  className: '',
  welcomeMessageName: '',
  welcomeMessageText: ''
};

export default SectionMessages;
