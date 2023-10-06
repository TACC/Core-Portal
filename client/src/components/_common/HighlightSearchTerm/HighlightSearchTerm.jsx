import React from 'react';
import PropTypes from 'prop-types';
import styles from './HighlightSearchTerm.module.scss';

const HighlightSearchTerm = ({ searchTerm, content }) => {
  const highlightParts = () => {
    const parts = content.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <b className={styles['highlight']} key={i}>
          {part}
        </b>
      ) : (
        part
      )
    );
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
