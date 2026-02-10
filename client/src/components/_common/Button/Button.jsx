import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

import styles from './Button.module.css';
import LoadingSpinner from '_common/LoadingSpinner';
import emptyStringValidator from '_common/CommonUtils';

export const TYPE_MAP = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  active: 'is-active',
  link: 'as-link',
};
export const TYPES = [''].concat(Object.keys(TYPE_MAP));

export const SIZE_MAP = {
  short: 'width-short',
  medium: 'width-medium',
  long: 'width-long',
  auto: 'width-auto',
  small: 'size-small',
};
export const SIZES = [''].concat(Object.keys(SIZE_MAP));

export const ATTRIBUTES = ['button', 'submit', 'reset'];

const Button = ({
  children,
  className,
  iconNameBefore,
  iconNameAfter,
  type,
  size,
  dataTestid,
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
    size = 'auto';
    // Component will work, except `size` is auto-set
    console.debug(
      'A <Button> that is not `type="link"` and has no `size` ' +
        'is automatically assigned `size="auto"`.'
    );
  }

  return (
    <button
      className={`
        ${styles['root']}
        ${TYPE_MAP[type] ? styles[TYPE_MAP[type]] : ''}
        ${SIZE_MAP[size] ? styles[SIZE_MAP[size]] : ''}
        ${isLoading ? styles['loading'] : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      type={attr}
      onClick={onclick}
      data-testid={dataTestid}
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
          dataTestid="icon-before"
          className={iconNameBefore ? styles['icon--before'] : ''}
        />
      ) : (
        ''
      )}
      <span className={styles['text']} data-testid="text">
        {children}
      </span>
      {iconNameAfter && (
        <Icon
          name={iconNameAfter}
          dataTestid="icon-after"
          className={iconNameAfter ? styles['icon--after'] : ''}
        />
      )}
    </button>
  );
};
Button.propTypes = {
  children: emptyStringValidator,
  className: PropTypes.string,
  iconNameBefore: PropTypes.string,
  iconNameAfter: PropTypes.string,
  type: PropTypes.oneOf(TYPES),
  size: PropTypes.oneOf(SIZES),
  dataTestid: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  attr: PropTypes.oneOf(ATTRIBUTES),
  isLoading: PropTypes.bool,
};
Button.defaultProps = {
  className: '',
  iconNameBefore: '',
  iconNameAfter: '',
  type: 'secondary',
  size: '', // unless `type="link", defaults to `short` after `propTypes`
  dataTestid: undefined,
  disabled: false,
  onClick: null,
  attr: 'button',
  isLoading: false,
};

export default Button;
