import React from 'react';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import './Paginator.module.scss';

const PaginatorPage = ({ number, callback, current }) => {
  return (
    <Button
      styleName={`page ${current ? 'current' : ''}`}
      onClick={() => callback(number)}
    >
      {number}
    </Button>
  ) 
}

PaginatorPage.propTypes = {
  number: PropTypes.number.isRequired,
  callback: PropTypes.func.isRequired,
  current: PropTypes.bool
}

PaginatorPage.defaultProps = {
  current: false
}

const Paginator = ({ pages, current, callback }) => {
  const start = Math.max(current - 2, 2);
  const end = Math.min(current + 2, pages - 1);
  const middle = Array(end - start + 1).fill().map((_, index) => start + index)
  console.log(middle);
  return (
    <div>
      <Button color="link" styleName="endcap">
        <FontAwesomeIcon icon={faChevronLeft} />
        <span>
          Previous
        </span>
      </Button>
      <PaginatorPage number={1} callback={callback} />
      {
        middle[0] > 2 && (
          <span>...</span>
        )
      }
      {
        middle.map(
          number => {
          return <PaginatorPage 
            number={number} 
            key={number}
            current={number === current}
            callback={callback}
          />
          }
        )
      }
      {
        middle[middle.length - 1] < pages - 1 && (
          <span>...</span>
        )
      }
      <PaginatorPage number={pages} callback={callback}/>
      <Button color="link" styleName="endcap">
        <span>
          Next
        </span>
        <FontAwesomeIcon icon={faChevronRight} />
      </Button>
    </div>
  );
};

export default Paginator;
