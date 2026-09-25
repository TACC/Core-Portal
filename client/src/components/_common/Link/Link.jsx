import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import buttonStyles from './Link.module.css';

export const TYPE_MAP = {
  link: 'as-link',
  button: 'as-button',
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

const Link = ({
  href,
  target,
  rel,
  type,
  size,
  className,
  children,
  ...props
}) => {
  return (
    <RouterLink
      to={href}
      target={target ? target : ''}
      rel={rel ? rel : ''}
      data-testid="text"
      role="link"
      className={`
      ${TYPE_MAP[type] ? buttonStyles[TYPE_MAP[type]] : ''}
      ${SIZE_MAP[size] ? buttonStyles[SIZE_MAP[size]] : ''}
      ${type ? buttonStyles['root'] : ''}
      ${className}
    `}
      {...props}
    >
      {children}
    </RouterLink>
  );
};
Link.propTypes = {
  type: PropTypes.oneOf(['', ...Object.keys(TYPE_MAP)]),
  size: PropTypes.oneOf(['', ...Object.keys(SIZE_MAP)]),
  className: PropTypes.string,
};
Link.defaultProps = { type: '', size: '', className: '' };
export default Link;
