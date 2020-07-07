import React from 'react';
import PropTypes from 'prop-types';
import { default as MessageIcon } from './MessageIcon';

const TYPES = PropTypes.oneOf(['info', 'warning', 'error']);
const TYPE_ICON_MAP = {
  info: undefined,
  warning: 'alert',
  error: 'alert'
};

const Message = ({ type, text }) => {
  const iconName = TYPE_ICON_MAP[type];
  const modiferName = `is-${type}`;

  return (
    <span styleName={`root ${modiferName}`} data-testid="root">
      <MessageIcon name={iconName} data-testid="icon" />
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
