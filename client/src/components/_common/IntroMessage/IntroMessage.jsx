import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { SectionMessage } from '_common';

import styles from './IntroMessage.module.css';

/**
 * Whether the name is of a known intro message
 * @param {String} messageName - The name of the message to check
 */
export function isKnownMessage(messageName) {
  const introMessages = useSelector((state) => state.introMessages);

  return introMessages && introMessages[messageName];
}

/**
 * A message which, when dismissed, will not appear again unless browser storage is cleared
 *
 * _This message is designed for user introduction to sections, but can be abstracted further into a `<DismissableMessage>` or abstracted less such that a message need not be passed in._
 *
 * @example
 * // message with custom text, class, and identifier
 * <IntroMessage
 *   className="external-message-class"
 *   messageName={identifierForMessageLikeRouteName}
 * >
 *   Introductory text (defined externally).
 * </IntroMessage>
 */
function IntroMessage({ children, className, messageName }) {
  const dispatch = useDispatch();
  const introMessages = useSelector((state) => state.introMessages);
  const shouldShow = isKnownMessage(messageName);
  const [isVisible, setIsVisible] = useState(shouldShow);

  // Manage visibility
  const onDismiss = useCallback(() => {
    const newMessagesState = {
      ...introMessages,
      [messageName]: false,
    };
    dispatch({ type: 'SAVE_INTRO', payload: newMessagesState });

    setIsVisible(!isVisible);
  }, [isVisible]);

  return (
    <SectionMessage
      aria-label={messageName}
      type="info"
      canDismiss
      className={`${styles.root} ${className}`}
      isVisible={isVisible}
      onDismiss={onDismiss}
    >
      {children}
    </SectionMessage>
  );
}
IntroMessage.propTypes = {
  /** Message as text or element(s) */
  children: PropTypes.node.isRequired,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** A unique identifier for the message */
  messageName: PropTypes.string.isRequired,
};
IntroMessage.defaultProps = {
  className: '',
};

export default IntroMessage;
