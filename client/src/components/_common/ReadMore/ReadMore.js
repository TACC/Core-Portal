import React, { useState, useLayoutEffect, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'reactstrap';
import './ReadMore.module.scss';

const ReadMore = ({ className, text }) => {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const containerRef = useRef();

  const toggleCallback = useCallback(() => {
    setExpanded(!isOpen);
  }, [expanded, setExpanded]);

  useLayoutEffect(
    () => {
      if (!hasOverflow && containerRef.current.scrollHeight > containerRef.current.offsetHeight) {
        setHasOverflow(true);
        return;
      }
      if (hasOverflow && containerRef.current.scrollHeight <= containerRef.current.offsetHeight) {
        setHasOverflow(false);
        return;
      }
    },
    [hasOverflow, setHasOverflow, containerRef]
  );

  return (
    <>
      <div styleName="text-container" className={className} ref={containerRef}>
        {text}
      </div>
      {hasOverflow && <div>Read more</div>}
    </>
  );
};

export default ReadMore;
