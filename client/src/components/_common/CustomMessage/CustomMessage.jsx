import React from 'react';
import PropTypes from 'prop-types';
import { SectionMessage } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import styles from './CustomMessage.module.scss';

/**
 * A message which, is created by the admin. Like IntroMessage, when dismissed, will not appear again.
 *
 * _This message is designed for custom messages from the admin.
 *
 * @example
 * // message with identifier
 * <CustomMessage
 *   componentName={identifierForMessageLikeRouteName}
 * >
 * </CustomMessage>
 */
function CustomMessage({ componentName }) {
  const dispatch = useDispatch();
  const { messages, templates } = useSelector((state) => {
    return {
      messages: state.customMessages.messages.filter((msg) => msg.unread),
      templates: state.customMessages.templates.filter(
        (tmp) => tmp.component === componentName
      ),
    };
  });

  function onDismiss(msg) {
    const newCustomMessages = {
      templates: {
        ...templates,
      },
      messages: messages.map((message) => {
        message.unread =
          message.template_id === msg.template_id ? false : message.unread;
        return message;
      }),
    };
    dispatch({
      type: 'SAVE_CUSTOM',
      payload: newCustomMessages,
    });
  }

  return messages.map((message) => {
    if (message.unread) {
      const currentTemplate = templates.find(
        (template) => template.id == message.template_id
      );

      if (currentTemplate && message.unread) {
        return (
          <div key={message.template_id} className={styles.message}>
            <SectionMessage
              type={currentTemplate.message_type}
              canDismiss={currentTemplate.dismissable}
              onDismiss={() => onDismiss(message)}
            >
              {currentTemplate.message}
            </SectionMessage>
          </div>
        );
      }
    }
  });
}

CustomMessage.propTypes = {
  /** A unique identifier for the message */
  componentName: PropTypes.string.isRequired,
};

export default CustomMessage;
