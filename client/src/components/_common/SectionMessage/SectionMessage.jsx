import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Message from '_common/Message';

/**
 * Show an event-based message to the user
 * @example
 * // Basic usage
 * <SectionMessage type="warning">Uh oh.</Section>
 * @example
 * // Manage onDismiss via props
 * // CAVEAT: Available through `<Message>` but (maybe) not `<SectionMessage>`
 * ...
 * const [isVisible, setIsVisible] = useState(...);
 *
 * const onDismiss = useCallback(() => {
 *   setIsVisible(!isVisible);
 * }, [isVisible]);
 *
 * return (
 *   <Message
 *     type="warning"
 *     isVisible={isVisible}
 *     onDismiss={onDismiss}
 *   >
 *     Uh oh.
 *   </Message>
 * );
 * ...
 */
const SectionMessage = (props) => {
  const [isVisible, setIsVisible] = useState(true);

  // Manage visibility
  const onDismiss = useCallback(() => {
    setIsVisible(!isVisible);
    props.onDismiss();
  }, [isVisible]);

  // Override default props
  const messageProps = {
    ...Message.defaultProps,
    ...props,
    isVisible,
    onDismiss,
    scope: 'section',
  };

  // Avoid manually syncing <Message>'s props
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Message {...messageProps} />;
};
SectionMessage.propTypes = {
  ...Message.propTypes,
  isVisible: PropTypes.bool,
  onDismiss: PropTypes.func,
};
SectionMessage.defaultProps = Message.defaultProps;

export default SectionMessage;
