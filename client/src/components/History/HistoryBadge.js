import React from 'react';
import { number } from 'prop-types';
import './History.module.scss';

const HistoryBadge = ({ unread }) => {
  if (unread) {
    return <div styleName="history-badge">{unread}</div>;
  }
  return <></>;
};
HistoryBadge.propTypes = {
  unread: number.isRequired
};

export default HistoryBadge;
