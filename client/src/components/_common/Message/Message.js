import React from 'react';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import './Message.module.scss';

const JSXpropType = PropTypes.any;
// const JSXpropType = PropTypes.oneOfType([
//   PropTypes.string,
//   PropTypes.element,
//   PropTypes.elementType
// ]);

export const TYPE_ICON_MAP = {
  info: {
    name: 'conversation',
    text: 'Notice'
  },
  success: {
    name: 'approved-reverse',
    text: 'Notice'
  },
  warn: {
    name: 'alert',
    text: 'Warning'
  },
  error: {
    name: 'alert',
    text: 'Error'
  }
};
const TYPES = PropTypes.oneOf(Object.keys(TYPE_ICON_MAP));

/** Show an event-based message to the user */
const Message = ({ children, className, hidden, type }) => {
  const iconName = TYPE_ICON_MAP[type].name;
  const iconText = TYPE_ICON_MAP[type].text;
  const containerStyleName = `container is-${type}`;

  return (
    <span
      styleName={containerStyleName}
      className={className}
      hidden={hidden}
      role="status"
    >
      <Icon styleName="icon" name={iconName}>
        {iconText}
      </Icon>
      <span styleName="text" data-testid="text">
        {children}
      </span>
    </span>
  );
};
Message.propTypes = {
  /** Message text (as child node) */
  /* FAQ: We can support any values, even a component */
  // eslint-disable-next-line react/forbid-prop-types
  children: JSXpropType.isRequired,
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Allow external management of visibility */
  hidden: PropTypes.bool,
  /** Message type or severity */
  type: TYPES.isRequired
};
Message.defaultProps = {
  className: '',
  hidden: false
};

export default Message;
