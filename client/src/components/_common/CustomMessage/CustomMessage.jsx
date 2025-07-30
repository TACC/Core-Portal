import React from 'react';
import PropTypes from 'prop-types';
import { SectionMessage } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'html-react-parser';
import styles from './CustomMessage.module.scss';

/**
 * A message which, is created by the admin. Like IntroMessage, when dismissed, will not appear again.
 *
 * _This message is designed for custom messages from the admin.
 *
 * @example
 * // message with identifier
 * <CustomMessage
 *   messageComponentName={identifierForMessageLikeRouteName}
 * >
 * </CustomMessage>
 */
function CustomMessage({ messageComponentName }) {
  const dispatch = useDispatch();
  const messages = useSelector((state) => {
    const all = state.customMessages?.messages || [];
    return all.filter((message) => {
      return (
        message.unread &&
        message.template.component === messageComponentName
      );
    });
  });

  function onDismiss(dismissMessage) {
    const payload = {
      templateId: dismissMessage.template.id,
      unread: false,
    };
    dispatch({
      type: 'SAVE_CUSTOM_MESSAGES',
      payload,
    });
  }

  return messages.map((message) => {
    const template = message.template;
    return (
      <div key={template.id} className={styles.message}>
        <SectionMessage
          type={template.message_type}
          canDismiss={template.dismissible}
          onDismiss={() => onDismiss(message)}
        >
          {parse(template.message)}
        </SectionMessage>
      </div>
    );
  });
}

CustomMessage.propTypes = {
  /** A unique identifier for the message */
  messageComponentName: PropTypes.string.isRequired,
};

export default CustomMessage;
