import React from 'react';
import { number } from 'prop-types';
import './HistoryBadge.module.scss';

const HistoryBadge = ({ unread }) => {
  if (unread) {
    return (
      <span styleName="root" data-testid="history-badge" role="status">
        {unread < 1000 ? unread : '999+'}
      </span>
    );
  }
  return <></>;
};
HistoryBadge.propTypes = {
  unread: number.isRequired
};

export default HistoryBadge;
