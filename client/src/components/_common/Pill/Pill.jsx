import React from 'react';
import PropTypes from 'prop-types';
import styles from './Pill.module.scss';

function Pill({
  children,
  type = 'normal',
  className = '',
  shouldTruncate = true,
}) {
  let pillStyleName = `${styles['root']} ${styles[`is-${type}`]}`;

  if (shouldTruncate) pillStyleName += ` ${styles['should-truncate']}`;

  return (
    <span className={`${className} ${pillStyleName}`} title={children}>
      {children}
    </span>
  );
}

Pill.propTypes = {
  children: PropTypes.string.isRequired,
  type: PropTypes.string,
  className: PropTypes.string,
  shouldTruncate: PropTypes.bool,
};

export default Pill;
