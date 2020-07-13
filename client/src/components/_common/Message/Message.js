import React from 'react';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import './Message.module.scss';

const TYPE_ICON_MAP = {
  info: {
    name: false,
    text: 'Notice'
  },
  success: {
    name: 'approved-reverse', // WARNING: FP-288: Provide and test icon
    text: 'Notice'
  },
  warn: {
    name: 'alert', // WARNING: FP-288: Provide and test icon
    text: 'Warning'
  },
  error: {
    name: 'alert', // WARNING: FP-288: Provide and test icon
    text: 'Error'
  }
};
const TYPES = PropTypes.oneOf(Object.keys(TYPE_ICON_MAP));

/** Show an event-based message to the user */
const Message = ({ children, type }) => {
  const iconName = TYPE_ICON_MAP[type].name;
  const iconText = TYPE_ICON_MAP[type].text;
  const containerStyleName = `container is-${type}`;
  let optionalIcon;

  if (iconName) {
    optionalIcon = (
      <Icon styleName="icon" name={iconName}>
        {iconText}
      </Icon>
    );
  }

  return (
    <span styleName={containerStyleName} data-testid="message">
      {optionalIcon}
      <span styleName="text" data-testid="text">
        {children}
      </span>
    </span>
  );
};
Message.propTypes = {
  /** Message type or severity */
  type: TYPES.isRequired,
  /** Message text (as child node) */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired
};

export default Message;
