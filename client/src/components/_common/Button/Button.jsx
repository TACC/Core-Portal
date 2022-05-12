import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

import styles from './Button.module.css';
import LoadingSpinner from '_common/LoadingSpinner';

export const TYPES = ['', 'primary', 'secondary', 'link'];

export const SIZES = ['', 'short', 'medium', 'long', 'small'];

export const ATTRIBUTES = ['button', 'submit', 'reset'];

function isNotEmptyString(props, propName, componentName) {
  if (!props[propName] || props[propName].replace(/ /g, '') === '') {
    return new Error(`No text passed to ${componentName}. Validation failed.`);
  }
  return null;
}

const Button = ({
  children,
  iconNameBefore,
  iconNameAfter,
  type,
  size,
  disabled,
  onClick,
  attr,
  isLoading,
}) => {
  function onclick(e) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      return onClick(e);
    }
  }

  // Manage prop warnings
  /* eslint-disable no-console */
  if (type === 'link' && size) {
    size = '';
    // Component will work, except `size` is ineffectual
    console.warn('A <Button type="link"> ignores `size` prop.');
  }
  if (type === 'primary' && size === 'small') {
    type = 'secondary';
    // Component will work, except `type` is overridden
    console.error(
      'A <Button type="primary" size="small"> is not allowed. ' +
        'Using `type="secondary"` instead.'
    );
  }
  if (type !== 'link' && !size) {
    size = 'short';
    // Component will work, except `size` is auto-set
    console.debug(
      'A <Button> that is not `type="link"` and has no `size` ' +
        'is automatically assigned `size="short"`.'
    );
  }
  /* eslint-enable no-console */

  const buttonRootClass = styles['root'];

  let buttonTypeClass;
  if (type === 'link') {
    buttonTypeClass = styles['as-link'];
  } else if (type === 'primary' || type === 'secondary') {
    buttonTypeClass = styles[`${type}`];
  } else if (type === '') {
    buttonTypeClass = type;
  }

  let buttonSizeClass;
  if (size === 'small') {
    buttonSizeClass = styles['size-small'];
  } else {
    buttonSizeClass = styles[`width-${size}`];
  }

  const buttonLoadingClass = isLoading ? styles['loading'] : '';

  return (
    <button
      className={`
        ${buttonRootClass}
        ${buttonTypeClass}
        ${buttonSizeClass}
        ${buttonLoadingClass}
      `}
      disabled={disabled || isLoading}
      type={attr}
      onClick={onclick}
    >
      {isLoading && (
        <LoadingSpinner
          placement="inline"
          className={styles['loading-over-button']}
        />
      )}
      {iconNameBefore ? (
        <Icon
          name={iconNameBefore}
          className={iconNameBefore ? styles['icon--before'] : ''}
        ></Icon>
      ) : (
        ''
      )}
      <span className={styles['text']}>{children}</span>
      {iconNameAfter ? (
        <Icon
          name={iconNameAfter}
          className={iconNameAfter ? styles['icon--after'] : ''}
        ></Icon>
      ) : (
        ''
      )}
    </button>
  );
};
Button.propTypes = {
  children: isNotEmptyString,
  iconNameBefore: PropTypes.string,
  iconNameAfter: PropTypes.string,
  type: PropTypes.oneOf(TYPES),
  size: PropTypes.oneOf(SIZES),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  attr: PropTypes.oneOf(ATTRIBUTES),
  isLoading: PropTypes.bool,
};
Button.defaultProps = {
  iconNameBefore: '',
  iconNameAfter: '',
  type: 'secondary',
  size: '', // unless `type="link", defaults to `short` after `propTypes`
  disabled: false,
  onClick: null,
  attr: 'button',
  isLoading: false,
};

export default Button;
