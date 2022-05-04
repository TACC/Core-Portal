import React from 'react';
import { Pill } from '_common';
import { shape, string, bool, number } from 'prop-types';

const CELL_PROPTYPES = {
  cell: shape({
    value: string.isRequired,
  }).isRequired,
};

export const Display = ({ cell: { value } }) => (
  <strong className="wb-text-primary">{value}</strong>
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
