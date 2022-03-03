import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

import styles from './Button.module.css';
import LoadingSpinner from '_common/LoadingSpinner';

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
      className={`c-button ${buttonTypeClass} ${buttonSizeClass}`}
      disabled={disabled || isLoading}
      type={attr}
      onClick={onclick}
    >
      {isLoading && (
        <LoadingSpinner
          placement={styles['over-text']}
          className={styles['loading-over-button']}
        />
      )}
      <Icon
        name={iconNameBefore}
        className={iconNameBefore ? styles['icon--before'] : ''}
      ></Icon>
      <span className={isLoading ? styles['loading-text'] : ''}>
        {children}
      </span>
      <Icon
        name={iconNameAfter}
        className={iconNameAfter ? styles['icon--after'] : ''}
      ></Icon>
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
  type: '',
  size: 'medium',
  disabled: false,
  onClick: null,
  attr: 'button',
  isLoading: false,
};

export default Button;
