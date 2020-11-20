import React from 'react';
import PropTypes from 'prop-types';
import { Fade } from 'reactstrap';
import Icon from '_common/Icon';

import './Message.module.scss';

export const TYPE_MAP = {
  info: {
    iconName: 'conversation',
    className: 'is-info',
    iconText: 'Notice'
  },
  success: {
    iconName: 'approved-reverse',
    className: 'is-success',
    iconText: 'Notice'
  },
  warn: {
    iconName: 'alert',
    className: 'is-warn',
    iconText: 'Warning'
  },
  error: {
    iconName: 'alert',
    className: 'is-error',
    iconText: 'Error'
  }
};
export const TYPES = Object.keys(TYPE_MAP);

export const SCOPE_MAP = {
  inline: {
    className: 'is-scope-inline',
    role: 'status',
    tagName: 'span'
  },
  section: {
    className: 'is-scope-section',
    role: 'status',
    tagName: 'p'
  }
  // app: 'is-scope-app' // FAQ: Do not use. Use a Notification Toast instead
};
export const SCOPES = ['', ...Object.keys(SCOPE_MAP)];
export const DEFAULT_SCOPE = 'inline';

/**
 * Show an event-based message to the user
 * @todo Document examples
 * @example
 * // Blah blah…
 * <Sample jsx>
 */
const Message = ({
  children,
  className,
  onToggleVisibility,
  canDismiss,
  isVisible,
  scope,
  type
}) => {
  const { iconName, iconText } = TYPE_MAP[type];
  const { role, tagName } = SCOPE_MAP[scope || DEFAULT_SCOPE];

  // Manage class names
  const modifierClassNames = [];
  modifierClassNames.push(TYPE_MAP[type].className);
  modifierClassNames.push(SCOPE_MAP[scope || DEFAULT_SCOPE].className);
  const containerStyleNames = ['container', ...modifierClassNames].join(' ');

  // Manage disappearance
  // FAQ: Design does not want fade, but we still use <Fade> to manage dismissal
  // TODO: Consider replacing <Fade> with a replication of `unmountOnExit: true`
  const shouldFade = false;
  const fadeProps = {
    ...Fade.defaultProps,
    unmountOnExit: true,
    baseClass: shouldFade ? Fade.defaultProps.baseClass : '',
    timeout: shouldFade ? Fade.defaultProps.timeout : 0
  };

  return (
    <Fade
      // Avoid manually syncing Reactstrap <Fade>'s default props
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...fadeProps}
      tag={tagName}
      styleName={containerStyleNames}
      className={className}
      role={role}
      in={isVisible}
    >
      <Icon styleName="icon type-icon" name={iconName}>
        {iconText}
      </Icon>
      <span styleName="text" data-testid="text">
        {children}
      </span>
      {canDismiss && scope === 'section' ? (
        <button
          type="button"
          styleName="close-button"
          aria-label="Close"
          onClick={onToggleVisibility}
        >
          <Icon styleName="icon close-icon" name="close" />
        </button>
      ) : null}
    </Fade>
  );
};
Message.propTypes = {
  /** Whether a close button is available (only for `section` scope messages) */
  canDismiss: PropTypes.bool,
  /** Message text (as child node) */
  /* FAQ: We can support any values, even a component */
  children: PropTypes.node.isRequired, // This checks for any render-able value
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Optional flag for whether message is visible (see `onToggleVisibility`) */
  isVisible: PropTypes.bool,
  /** Optional action triggered on close button click (see `isVisible`) */
  onToggleVisibility: PropTypes.func,
  /** How to place the message within the layout */
  scope: PropTypes.oneOf(SCOPES), // RFE: Require scope. Change all instances.
  /** Message type or severity */
  type: PropTypes.oneOf(TYPES).isRequired
};
Message.defaultProps = {
  className: '',
  canDismiss: false,
  isVisible: true,
  onToggleVisibility: () => {},
  scope: DEFAULT_SCOPE
};

export default Message;
