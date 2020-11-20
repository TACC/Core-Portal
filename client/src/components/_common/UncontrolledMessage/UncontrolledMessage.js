import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Message from '_common/Message';

/**
 * Show an event-based message to the user
 * @todo Document examples
 * @example
 * // Blah blah…
 * <Sample jsx>
 */
const UncontrolledMessage = props => {
  const [isVisible, setIsVisible] = useState(true);

  // Manage visibility
  const onDismiss = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  // Override default props
  const messageProps = {
    ...Message.defaultProps,
    ...props,
    onDismiss,
    isVisible
  };

  // Avoid manually syncing <UncontrolledMessage>'s props
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Message {...messageProps} />;
};
UncontrolledMessage.propTypes = {
  ...Message.propTypes,
  isVisible: PropTypes.bool,
  onDismiss: PropTypes.func
};
UncontrolledMessage.defaultProps = Message.defaultProps;

export default UncontrolledMessage;
