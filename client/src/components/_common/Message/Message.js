import React from 'react';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import './Message.module.scss';

export const TYPE_MAP = {
  info: {
    iconName: 'conversation',
    className: 'is-info',
    text: 'Notice'
  },
  success: {
    iconName: 'approved-reverse',
    className: 'is-success',
    text: 'Notice'
  },
  warn: {
    iconName: 'alert',
    className: 'is-warn',
    text: 'Warning'
  },
  error: {
    iconName: 'alert',
    className: 'is-error',
    text: 'Error'
  }
};
export const TYPES = Object.keys(TYPE_MAP);

export const SCOPE_CLASS_MAP = {
  inline: 'is-scope-inline',
  section: 'is-scope-section'
  // app: 'is-scope-app' // FAQ: Do not use. Use a Notification Toast instead
};
export const SCOPES = ['', ...Object.keys(SCOPE_CLASS_MAP)];
export const DEFAULT_SCOPE = 'inline';

/** Show an event-based message to the user */
const Message = ({ children, className, hidden, scope, type }) => {
  const { iconName, iconText } = TYPE_MAP[type];
  const modifierClassNames = [];
  modifierClassNames.push(TYPE_MAP[type].className);
  modifierClassNames.push(SCOPE_CLASS_MAP[scope || DEFAULT_SCOPE]);
  const containerStyleNames = ['container', ...modifierClassNames].join(' ');

  return (
    <span
      styleName={containerStyleNames}
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
  children: PropTypes.node.isRequired, // This checks for any render-able value
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Allow external management of visibility */
  hidden: PropTypes.bool,
  /** How to place the message within the layout */
  scope: PropTypes.oneOf(SCOPES), // RFE: Require scope. Change all instances.
  /** Message type or severity */
  type: PropTypes.oneOf(TYPES).isRequired
};
Message.defaultProps = {
  className: '',
  hidden: false,
  scope: DEFAULT_SCOPE
};

export default Message;
