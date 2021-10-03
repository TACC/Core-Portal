import React from 'react';
import PropTypes, { number } from 'prop-types';
import './HistoryBadge.module.scss';

const HistoryBadge = ({ unread, disabled }) => {
  const rootStyle = disabled ? 'root disabled' : 'root';
  if (unread) {
    return (
      <span styleName={rootStyle} role="status">
        {unread < 1000 ? unread : '999+'}
      </span>
    );
  }
  return <></>;
};
HistoryBadge.propTypes = {
  unread: number.isRequired,
  disabled: PropTypes.bool
};

HistoryBadge.defaultProps = {
  disabled: false
};

export default HistoryBadge;
