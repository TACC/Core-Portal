import React from 'react';
import { useSelector } from 'react-redux';
import { string } from 'prop-types';

const ErrorMessage = () => {
  return <span>Try reloading the page.</span>;
};

export const HistoryTable = ({ page }) => {
  const { list } = useSelector(state => state.notifications);
  console.log(list);
  return <div>{page}</div>;
};
HistoryTable.propTypes = {
  page: string.isRequired
};

export default HistoryTable;
