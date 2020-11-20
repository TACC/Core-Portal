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
  const onToggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
  }, [isVisible]);

  // Override default props
  const messageProps = {
    ...Message.defaultProps,
    ...props,
    onToggleVisibility,
    isVisible
  };

  // Avoid manually syncing <UncontrolledMessage>'s props
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Message {...messageProps} />;
};
UncontrolledMessage.propTypes = {
  ...Message.propTypes,
  isVisible: PropTypes.bool,
  onToggleVisibility: PropTypes.func
};
UncontrolledMessage.defaultProps = Message.defaultProps;

export default UncontrolledMessage;
