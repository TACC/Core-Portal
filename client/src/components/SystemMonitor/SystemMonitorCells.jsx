import React from 'react';
import { Pill } from '_common';
import { shape, string, bool, number } from 'prop-types';
import { Link } from 'react-router-dom';

const CELL_PROPTYPES = {
  cell: shape({
    value: string.isRequired,
  }).isRequired,
};

export const Display = ({ cell: { row } }) => (
  <strong>
    <Link
      className="wb-text-primary"
      to={`/workbench/system-status/${row.original.hostname}`}
    >
      {row.original.display_name}
    </Link>
  </strong>
);
Display.propTypes = CELL_PROPTYPES;

export const Operational = ({ cell: { value } }) => (
  <>
    {value ? (
      <Pill type="success">Operational</Pill>
    ) : (
      <Pill type="warning">Maintenance</Pill>
    )}
  </>
);
Operational.propTypes = {
  cell: shape({
    value: bool.isRequired,
  }).isRequired,
};

export const Load = ({ cell: { value } }) => (
  <span>{value ? `${value}%` : '--'}</span>
);
Load.propTypes = { cell: shape({ value: number.isRequired }).isRequired };
