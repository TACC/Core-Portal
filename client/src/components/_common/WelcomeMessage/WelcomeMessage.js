import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';

function WelcomeMessage({ children, className, messageName }) {
  const dispatch = useDispatch();
  const welcomeMessages = useSelector(state => state.welcomeMessages);

  function onDismiss(name) {
    const newMessagesState = {
      ...welcomeMessages,
      [name]: false
    };
    dispatch({ type: 'SAVE_WELCOME', payload: newMessagesState });
  }

  return (
    <Alert
      // The `welcomeMessages` state is not available during testing
      isOpen={welcomeMessages && welcomeMessages[messageName]}
      toggle={() => onDismiss(messageName)}
      color="secondary"
      className={className}
    >
      {children}
    </Alert>
  );
}
WelcomeMessage.propTypes = {
  /** Message as text or element(s) */
  children: PropTypes.node.isRequired,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** A unique identifier for the message */
  messageName: PropTypes.string.isRequired
};
WelcomeMessage.defaultProps = {
  className: ''
};

export default WelcomeMessage;
