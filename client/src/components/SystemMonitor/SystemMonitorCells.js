import React from 'react';
import { Badge } from 'reactstrap';
import { shape, string, bool } from 'prop-types';

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
      <Badge
        color="success"
        className="label-system-status"
        style={{ width: '100%', fontSize: '14px' }}
      >
        Operational
      </Badge>
    ) : (
      <Badge
        color="warning"
        className="label-system-status"
        style={{ width: '100%', fontSize: '14px' }}
      >
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
