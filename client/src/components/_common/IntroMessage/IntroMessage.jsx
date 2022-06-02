import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { SectionMessage } from '_common';

import styles from './IntroMessage.module.css';

/**
 * Whether the name is of a known intro message
 * @param {String} messageComponentName - The name of the component that contains the message
 */
export function isKnownMessage(messageComponentName) {
  const introMessageComponents = useSelector(
    (state) => state.introMessageComponents
  );

  return introMessageComponents && introMessageComponents[messageComponentName];
}

/**
 * A message which, when dismissed, will not appear again unless browser storage is cleared
 *
 * _This message is designed for user introduction to sections, but can be abstracted further into a `<DismissibleMessage>` or abstracted less such that a message need not be passed in._
 *
 * @example
 * // message with custom text, class, and identifier
 * <IntroMessage
 *   className="external-message-class"
 *   messageComponentName={identifierForMessageLikeRouteName}
 * >
 *   Introductory text (defined externally).
 * </IntroMessage>
 */
function IntroMessage({ children, className, messageComponentName }) {
  const dispatch = useDispatch();
  const introMessageComponents = useSelector(
    (state) => state.introMessageComponents
  );
  const shouldShow = isKnownMessage(messageComponentName);
  const [isVisible, setIsVisible] = useState(shouldShow);

  // Manage visibility
  const onDismiss = useCallback(() => {
    const newMessagesState = {
      ...introMessageComponents,
      [messageComponentName]: false,
    };
    dispatch({ type: 'SAVE_INTRO', payload: newMessagesState });

    setIsVisible(!isVisible);
  }, [isVisible]);

  return (
    <SectionMessage
      aria-label={messageComponentName}
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
