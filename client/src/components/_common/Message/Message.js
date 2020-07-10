import React from 'react';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import './Message.module.css';

const TYPE_ICON_MAP = {
  info: 'info',
  warn: 'alert',
  error: 'alert'
};
const TYPES = PropTypes.oneOf(Object.keys(TYPE_ICON_MAP));

const Message = ({ type, text }) => {
  const iconName = TYPE_ICON_MAP[type];
  const containerStyleName = `container is-${type}`;

  return (
    <span styleName={containerStyleName} data-testid="message">
      <Icon styleName="icon" name={iconName} />
      <span styleName="text" data-testid="text">
        {text}
      </span>
    </span>
  );
};
Message.propTypes = {
  type: TYPES.isRequired,
  text: PropTypes.string.isRequired
};

export default Message;
