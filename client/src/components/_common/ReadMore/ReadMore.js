import React, { useState, useCallback } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import './ReadMore.module.scss';

const ReadMore = ({ className, children }) => {
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
          styleName={expanded ? 'expanded' : 'clamped'}
          className={className}
          ref={ref}
        >
          {children}
        </div>
      }
      {(hasOverflow || expanded) && (
        <Button className="btn btn-link" onClick={toggleCallback}>
          <h6>{expanded ? 'Read Less' : 'Read More'}</h6>
        </Button>
      )}
    </>
  );
};

ReadMore.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

ReadMore.defaultProps = {
  className: ''
};

export default ReadMore;
