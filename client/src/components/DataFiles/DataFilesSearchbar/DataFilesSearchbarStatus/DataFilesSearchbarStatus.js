import PropTypes from 'prop-types';

export const createMessage = (count, query) =>
  `${count} Results Found for ${query}`;

const DataFilesSearchbarStatus = ({ query, count }) => {
  const message = count ? createMessage(count, query) : '';

  return message;
};
DataFilesSearchbarStatus.propTypes = {
  /* The search query */
  query: PropTypes.string.isRequired,
  /* The number of search results */
  count: PropTypes.number.isRequired
};

export default DataFilesSearchbarStatus;
