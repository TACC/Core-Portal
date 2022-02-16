import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

import styles from './Button.module.css';

export const TYPES = ['', 'primary', 'secondary', 'link'];

export const SIZES = ['short', 'medium', 'large', 'small'];

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
}) => {
  function onclick(e) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      return onclick(e);
    }
  }

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

  return (
    <button
      className={`${buttonRootClass} ${buttonTypeClass} ${buttonSizeClass}`}
      disabled={disabled}
      type={attr}
      onClick={onclick}
    >
    {iconNameBefore ?
      <Icon
        name={iconNameBefore}
        className={iconNameBefore ? styles['icon--before'] : ''}
      ></Icon>
    : ''}
      <span>{children}</span>
    {iconNameAfter ?
      <Icon
        name={iconNameAfter}
        className={iconNameAfter ? styles['icon--after'] : ''}
      ></Icon>
      : ''}
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
};
Button.defaultProps = {
  iconNameBefore: '',
  iconNameAfter: '',
  type: '',
  size: 'medium',
  disabled: false,
  onClick: null,
  attr: 'button',
};

export default Button;
