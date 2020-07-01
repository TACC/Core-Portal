import React from 'react';
import { number } from 'prop-types';
import './HistoryBadge.module.scss';

const HistoryBadge = ({ unread }) => {
  if (unread) {
    return (
      <div styleName="history-badge" data-testid="history-badge">
        {unread}
      </div>
    );
  }
  return <></>;
};
HistoryBadge.propTypes = {
  unread: number.isRequired
};

export default HistoryBadge;
