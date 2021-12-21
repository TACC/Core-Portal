import React, { useState, useCallback } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import styles from './ShowMore.module.scss';

const ShowMore = ({ className, children }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleCallback = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  const { height, ref } = useResizeDetector();

  const hasOverflow =
    ref && ref.current ? ref.current.scrollHeight > height : false;

  return (
    <>
      {
        <div
          className={`${className} ${
            expanded ? styles.expanded : styles.clamped
          }`}
          ref={ref}
        >
          {children}
        </div>
      }
      {(hasOverflow || expanded) && (
        <Button color="link" onClick={toggleCallback}>
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </>
  );
};

ShowMore.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

ShowMore.defaultProps = {
  className: '',
};

export default ShowMore;
