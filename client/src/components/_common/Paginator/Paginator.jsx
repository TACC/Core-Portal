import React from 'react';
import { Button } from '_common';
import PropTypes from 'prop-types';
import styles from './Paginator.module.scss';

const PaginatorEtc = () => {
  return <span className={styles.etcetera}>...</span>;
};

const PaginatorPage = ({ number, callback, current }) => {
  return (
    <Button
      size="small"
      type={number === current ? 'active' : 'secondary'}
      className={styles['page-root'] + ' ' + styles.page}
      onClick={() => callback(number)}
    >
      {number}
    </Button>
  );
};

PaginatorPage.propTypes = {
  number: PropTypes.number.isRequired,
  callback: PropTypes.func.isRequired,
  current: PropTypes.number.isRequired,
};

const Paginator = ({ pages, current, callback, spread }) => {
  let start, end;
  if (pages === 1 || pages === 2) {
    end = 0;
    start = pages;
  } else if (pages > 2 && pages <= spread) {
    start = 2;
    end = pages - 1;
  } else if (pages > spread && current <= 4) {
    start = 2;
    end = spread - 1;
  } else if (pages > spread && current > pages - (spread - 2)) {
    start = pages - (spread - 2);
    end = pages - 1;
  } else {
    const delta = Math.floor((spread - 2) / 2);
    start = current - delta;
    end = current + delta;
  }
  const middle = end - start + 1;
  const middlePages =
    middle > 0
      ? Array(middle)
          .fill()
          .map((_, index) => start + index)
      : [];
  return (
    <nav className={styles.root}>
      <Button
        type="link"
        className={styles.endcap}
        onClick={() => callback(current - 1)}
        disabled={current === 1}
      >
        <span>&lt; Previous</span>
      </Button>
      <PaginatorPage number={1} callback={callback} current={current} />
      {middlePages[0] > 2 && <PaginatorEtc />}
      {middlePages.map((number) => {
        return (
          <PaginatorPage
            number={number}
            key={number}
            current={current}
            callback={callback}
          />
        );
      })}
      {middlePages[middlePages.length - 1] < pages - 1 && <PaginatorEtc />}
      {pages > 1 && (
        <PaginatorPage number={pages} callback={callback} current={current} />
      )}
      <Button
        type="link"
        className={styles.endcap}
        onClick={() => callback(current + 1)}
        disabled={current === pages}
      >
        <span>Next &gt;</span>
      </Button>
    </nav>
  );
};

Paginator.propTypes = {
  pages: PropTypes.number.isRequired,
  current: PropTypes.number.isRequired,
  callback: PropTypes.func.isRequired,
  spread: PropTypes.number, // Number of page buttons to show
};

Paginator.defaultProps = {
  spread: 11,
};

export default Paginator;
