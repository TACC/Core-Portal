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
  <Link to={`/workbench/system-status/${row.original.hostname}`}>
    <strong className="wb-text-primary">{row.original.display_name}</strong>
  </Link>
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
