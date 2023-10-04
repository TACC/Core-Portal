import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import * as ROUTES from '../../../constants/routes';
import { getOutputPath } from 'utils/jobsUtil';

const HighlightSearchTerm = ({ searchTerm, cell, id }) => {
  const highlightParts = (content) => {
    const parts = content.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
  };

  if (id == 'Output Location') {
    const outputLocation = getOutputPath(cell.row.original);

    return outputLocation ? (
      <Link
        to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputLocation}`}
        className="wb-link job__path"
      >
        {highlightParts(outputLocation)}
      </Link>
    ) : null;
  } else if (id == 'uuid') {
    return <mark>{cell.render('Cell')}</mark>;
  } else if (id == 'name') {
    const jobName = cell.row.values[id];

    return <span>{highlightParts(jobName)}</span>;
  }

  return null;
};

HighlightSearchTerm.propTypes = {
  searchTerm: PropTypes.string,
  cell: PropTypes.object,
  id: PropTypes.string,
};

HighlightSearchTerm.defaultProps = {
  searchTerm: '',
  outputLocation: '',
};

export default HighlightSearchTerm;
