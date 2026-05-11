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
  const autoManageVisible = props.canDismiss && props.isVisible === undefined;
  const autoManageDismiss = props.canDismiss && props.onDismiss === undefined;

  function onDismiss() {
    if (autoManageVisible) {
      setIsVisible(!isVisible);
    }
    if (!autoManageDismiss) {
      props.onDismiss();
    }
  }

  // Override default props
  const messageProps = {
    ...Message.defaultProps,
    ...props,
    scope: 'section',
  };
  if (autoManageVisible) {
    messageProps.isVisible = isVisible;
  }
  if (autoManageDismiss) {
    messageProps.onDismiss = onDismiss;
  }

  // Avoid manually syncing <Message>'s props

  return <Message {...messageProps} />;
};
SectionMessage.propTypes = Message.propTypes;
SectionMessage.defaultProps = {
  ...Message.defaultProps,
  isVisible: undefined,
  onDismiss: undefined,
};

export default SectionMessage;
