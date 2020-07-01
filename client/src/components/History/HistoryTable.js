import React from 'react';
import { useSelector } from 'react-redux';
import { string } from 'prop-types';
import './History.module.scss';

const ErrorMessage = () => {
  return <span>Try reloading the page.</span>;
};

export const HistoryTable = ({ page }) => {
  const { list } = useSelector(state => state.notifications);
  return <div>{}</div>;
};
HistoryTable.propTypes = {
  page: string.isRequired
};

export default HistoryTable;
