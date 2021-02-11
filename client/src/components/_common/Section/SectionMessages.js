import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import {
  WelcomeMessage,
  shouldShowMessage as shouldShowWelcomeMessage
} from '_common';
import * as MESSAGES from '../../../constants/welcomeMessages';

import './SectionMessages.module.css';
import './SectionMessages.css';

/**
 * A list for section messages that supports:
 *
 * - messages (can automatically load welcome message)
 *
 * @example
 * // an automatic welcome message (if found), but no additional messages
 * <SectionMessages routeName="DASHBOARD" />
 * @example
 * // overwrite text of an automatic welcome message, but no additional messages
 * <SectionMessages
 *   routeName="DASHBOARD"
 *   welcomeText={`We welcome you to the dashboard, ${givenName}`} />
 * @example
 * // define text for a manual welcome message, but no additional messages
 * <SectionMessages welcomeText={`We welcome you to this page, ${givenName}`} />
 * @example
 * // an automatic welcome message (if found), and some additional messages
 * <SectionMessages routeName="DASHBOARD">
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 * @example
 * // no automatic welcome message; only some additional messages
 * <SectionMessages>
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 */
function SectionMessages({ children, className, routeName, welcomeText }) {
  const welcomeMessageText = welcomeText || MESSAGES[routeName];
  /* FAQ: An alternate message name allows tracking custom message dismissal */
  const welcomeMessageName = routeName || welcomeMessageText;
  const welcomeMessage = welcomeMessageText && (
    <WelcomeMessage messageName={welcomeMessageName}>
      {welcomeMessageText}
    </WelcomeMessage>
  );
  const hasMessage = shouldShowWelcomeMessage(routeName) || children.length > 0;
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
  /** Component-based message(s) (e.g. <Alert>, <Message>) (welcome message found automatically, given `routeName`) */
  children: PropTypes.node,
  /** Any additional className(s) for the root element */
  className: PropTypes.string,
  /** The name of the route section (to search for required welcome message) */
  routeName: PropTypes.string,
  /** Text either for a custom message or to overwrite standard message text */
  welcomeText: PropTypes.string
};
SectionMessages.defaultProps = {
  children: '',
  className: '',
  routeName: '',
  welcomeText: ''
};

export default SectionMessages;
