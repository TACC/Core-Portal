import React, { useState, useCallback } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import PropTypes from 'prop-types';
import { Button } from '_common';
import styles from './ShowMore.module.scss';

const ShowMore = ({ className, children }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleCallback = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  const { height, ref } = useResizeDetector();

  // overflowThreshold to account for minor differences in height for example 84.5 and 85
  const overflowThreshold = 1;
  const hasOverflow =
    ref && ref.current
      ? ref.current.scrollHeight - height > overflowThreshold
      : false;

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
        <Button type="link" onClick={toggleCallback}>
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
