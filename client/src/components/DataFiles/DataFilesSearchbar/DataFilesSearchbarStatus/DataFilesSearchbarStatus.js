import PropTypes from 'prop-types';
import { createTemplateFunction } from 'utils/taggedTemplates';

export const createMessage = createTemplateFunction`${'count'} Results Found for ${'query'}`;

const DataFilesSearchbarStatus = ({ query, count }) => {
  const message = count ? createMessage({ count, query }) : '';

  return message;
};
DataFilesSearchbarStatus.propTypes = {
  /* The search query */
  query: PropTypes.string.isRequired,
  /* The number of search results */
  count: PropTypes.number.isRequired
};

export default DataFilesSearchbarStatus;
