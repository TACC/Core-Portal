import React, { useMemo } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import queryStringParser from 'query-string';
import PropTypes from 'prop-types';
import styles from './SiteSearchPaginator.module.css';

const SiteSearchPaginator = ({ lastPageIndex }) => {
  const { pathname, search } = useLocation();
  const currentPage = parseInt(queryStringParser.parse(search).page, 10);
  const pageRange = useMemo(() => {
    const range = [];
    for (let i = currentPage - 5; i <= currentPage + 5; i += 1) {
      i > 0 && i <= lastPageIndex && range.push(i);
    }
    return range;
  }, [currentPage, lastPageIndex]);

  const pageHref = (page) => {
    const queryString = { ...queryStringParser.parse(search), page };
    return `${pathname}?${queryStringParser.stringify(queryString)}`;
  };

  const disabledLinkCallback = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <nav aria-label="Page navigation">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <NavLink
              className="page-link"
              to={pageHref(currentPage - 1)}
              aria-label="Previous"
              onClick={currentPage === 1 ? disabledLinkCallback : () => {}}
            >
              <span className={styles['paginator-link']} aria-hidden="true">
                &lsaquo;
              </span>
              <span className="sr-only">Previous</span>
            </NavLink>
          </li>
          {pageRange.map((i) => (
            <li key={i} className="page-item">
              <NavLink
                to={pageHref(i)}
                className={`page-link ${currentPage === i && styles.active}`}
              >
                <span className={styles['paginator-link']}>{i}</span>
              </NavLink>
            </li>
          ))}
          <li
            className={`page-item ${
              currentPage === lastPageIndex ? 'disabled' : ''
            }`}
          >
            <NavLink
              className="page-link"
              to={pageHref(currentPage + 1)}
              aria-label="next"
              onClick={
                currentPage === lastPageIndex ? disabledLinkCallback : () => {}
              }
            >
              <span className={styles['paginator-link']} aria-hidden="true">
                &rsaquo;
              </span>
              <span className="sr-only">Next</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
};
SiteSearchPaginator.propTypes = {
  lastPageIndex: PropTypes.number.isRequired,
};

export default SiteSearchPaginator;
