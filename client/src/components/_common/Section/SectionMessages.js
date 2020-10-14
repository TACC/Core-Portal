import React from 'react';
import PropTypes from 'prop-types';

import { WelcomeMessage } from '_common';
import * as MESSAGES from '../../../constants/welcomeMessages';

import './SectionMessages.module.css';

/**
 * A list for section messages that supports:
 *
 * - messages (can automatically load welcome message)
 *
 * @example
 * // An automatic welcome message (if found), but no additional messages
 * <SectionMessages routeName="DASHBOARD" />
 * @example
 * // An automatic welcome message (if found), and some additional messages
 * <SectionMessages routeName="DASHBOARD">
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 * @example
 * // No automatic welcome message; only some additional messages
 * <SectionMessages>
 *   <Alert color="success">You win!</Alert>
 *   <Alert color="secondary">
 *     <button>Claim your prize.</button>
 *   </Alert>
 * </SectionMessages>
 */
function SectionMessages({ children, className, routeName }) {
  const messageText = MESSAGES[routeName];
  const welcomeMessage = messageText && (
    <WelcomeMessage messageName={routeName}>{messageText}</WelcomeMessage>
  );

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
  routeName: PropTypes.string
};
SectionMessages.defaultProps = {
  children: <></>,
  className: '',
  routeName: ''
};

export default SectionMessages;
