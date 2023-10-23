import React from 'react';
import PropTypes from 'prop-types';
import styles from './HighlightSearchTerm.module.scss';

const HighlightSearchTerm = ({ searchTerm, content }) => {
  if (!searchTerm) {
    return <>{content}</>;
  }

  const searchTermRegex = new RegExp(`(${searchTerm})`, 'gi');

  const highlightParts = () => {
    const parts = content.split(searchTermRegex);
    return parts.map((part, i) => {
      const isSearchTerm = part.match(searchTermRegex);
      return isSearchTerm ? (
        <b className={styles['highlight']} key={i}>
          {part}
        </b>
      ) : (
        part
      );
    });
  };

  return <>{highlightParts()}</>;
};

HighlightSearchTerm.propTypes = {
  searchTerm: PropTypes.string,
  content: PropTypes.string,
};

HighlightSearchTerm.defaultProps = {
  searchTerm: '',
  content: '',
};

export default HighlightSearchTerm;
