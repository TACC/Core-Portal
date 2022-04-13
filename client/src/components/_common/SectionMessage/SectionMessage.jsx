import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Message from '_common/Message';

/**
 * Show a section/page-specific event-based message to the user
 * @example
 * // basic usage
 * <SectionMessage type="warning">Uh oh.</SectionMessage>
 * @see _common/Message
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
