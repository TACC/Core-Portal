import React from 'react';
import Message from '_common/Message';

/**
 * Show a component-specific event-based message to the user
 * @example
 * // basic usage
 * <InlineMessage type="success">Task complete.</InlineMessage>
 * @see _common/Message
 */
const InlineMessage = (props) => {
  // Override default props
  const messageProps = {
    ...Message.defaultProps,
    ...props,
    canDismiss: false,
    scope: 'inline',
  };

  // Avoid manually syncing <Message>'s props

  return <Message {...messageProps} />;
};
InlineMessage.propTypes = Message.propTypes;
InlineMessage.defaultProps = Message.defaultProps;

export default InlineMessage;
