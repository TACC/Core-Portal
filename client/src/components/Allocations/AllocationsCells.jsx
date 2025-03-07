import React from 'react';
import { useHistory } from 'react-router-dom';
import { shape, arrayOf, number, string } from 'prop-types';
import { Badge } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '_common';

const CELL_PROPTYPES = {
  cell: shape({
    value: arrayOf(shape({})).isRequired,
  }).isRequired,
};

export const Team = ({ cell: { value } }) => {
  const { projectId, page } = value;
  const history = useHistory();
  return (
    <>
      <Button onClick={() => history.push(`${page}/${projectId}`)} size="small">
        View Team
      </Button>
    </>
  );
};
Team.propTypes = {
  cell: shape({
    value: shape({
      projectId: number.isRequired,
      page: string.isRequired,
    }).isRequired,
  }).isRequired,
};

export const Systems = ({ cell }) => (
  <div className="sub-table-row">
    {cell.value.map(({ name }) => (
      <div key={uuidv4()} className="sub-table-cell">
        <span style={{ marginLeft: '1em' }}>{name}</span>
      </div>
    ))}
  </div>
);
Systems.propTypes = CELL_PROPTYPES;

export const Awarded = ({ cell }) => (
  <div className="sub-table-row">
    {cell.value.map(({ awarded, type }) => (
      <div key={uuidv4()} className="sub-table-cell">
        {awarded} {type === 'HPC' ? 'SU' : 'GB'}
      </div>
    ))}
  </div>
);
Awarded.propTypes = CELL_PROPTYPES;

export const Remaining = ({ cell }) => {
  const getColor = (val) => {
    if (val > 0.33) {
      if (val > 0.66) return 'success';
      return 'warning';
    }
    return 'danger';
  };
  return (
    <div className="sub-table-row">
      {cell.value.map(({ remaining, ratio, type, id }) => (
        <div key={uuidv4()} className="sub-table-cell">
          <span>
            <Badge
              className={`alloc-badge badge-${getColor(ratio)}`}
              color={null}
            >
              {remaining} {type === 'HPC' ? 'SU' : 'GB'}
            </Badge>
          </span>
        </div>
      ))}
    </div>
  );
};
Remaining.propTypes = CELL_PROPTYPES;

export const Expires = ({ row: { values } }) => (
  <div className="sub-table-row">
    {values.expires.map(({ date }) => (
      <div
        key={uuidv4()}
        className="sub-table-cell"
        data-testid="expiration-date"
      >
        <span>{date}</span>
      </div>
    ))}
  </div>
);
Expires.propTypes = {
  row: shape({
    values: shape({}).isRequired,
  }).isRequired,
};
