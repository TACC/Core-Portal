import React from 'react';
import { Badge } from 'reactstrap';
import { shape, string, bool, number } from 'prop-types';

const CELL_PROPTYPES = {
  cell: shape({
    value: string.isRequired
  }).isRequired
};

export const Display = ({ cell: { value } }) => (
  <span className="wb-text-primary wb-bold">{value}</span>
);
Display.propTypes = CELL_PROPTYPES;

export const Operational = ({ cell: { value } }) => (
  <>
    {value ? (
      <Badge color="success" className="label-system-status">
        Operational
      </Badge>
    ) : (
      <Badge color="warning" className="label-system-status">
        Maintenance
      </Badge>
    )}
  </>
);
Operational.propTypes = {
  cell: shape({
    value: bool.isRequired
  }).isRequired
};

export const Load = ({ cell: { value } }) => (
  <span>{value ? `${value}%` : '--'}</span>
);
Load.propTypes = { cell: shape({ value: number.isRequired }).isRequired };
