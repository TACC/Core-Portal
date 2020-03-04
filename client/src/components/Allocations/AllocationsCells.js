import React, { useState } from 'react';
import { object, shape, array, number } from 'prop-types';
import { Button, Badge } from 'reactstrap';
import { useDispatch } from 'react-redux';
import uuid from 'uuid';
import { TeamView } from './AllocationsModals';

const CELL_PROPTYPES = {
  cell: shape({
    value: array.isRequired
  }).isRequired
};

export const Team = ({ cell: { value } }) => {
  const dispatch = useDispatch();
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <Button
        className="btn btn-sm"
        color="link"
        onClick={() => {
          dispatch({
            type: 'GET_TEAMS',
            payload: { id: value }
          });
          setOpenModal(true);
        }}
        disabled={openModal}
      >
        View Team
      </Button>
      <TeamView
        isOpen={openModal}
        pid={value}
        toggle={() => setOpenModal(!openModal)}
      />
    </>
  );
};
Team.propTypes = {
  cell: shape({
    value: number.isRequired
  }).isRequired
};

export const Systems = ({ cell }) => (
  <div className="sub-table-row">
    {cell.value.map(({ name }) => (
      <div key={uuid()} className="sub-table-cell">
        <span style={{ marginLeft: '1em' }}>{name}</span>
      </div>
    ))}
  </div>
);
Systems.propTypes = CELL_PROPTYPES;

export const Awarded = ({ cell }) => (
  <div className="sub-table-row">
    {cell.value.map(({ awarded, type }) => (
      <div key={uuid()} className="sub-table-cell">
        {awarded} {type === 'HPC' ? 'SU' : 'GB'}
      </div>
    ))}
  </div>
);
Awarded.propTypes = CELL_PROPTYPES;

export const Remaining = ({ cell }) => {
  const getColor = val => {
    if (val > 0.33) {
      if (val > 0.66) return 'success';
      return 'warning';
    }
    return 'danger';
  };
  return (
    <div className="sub-table-row">
      {cell.value.map(({ remaining, ratio, type, id }) => (
        <div key={uuid()} className="sub-table-cell">
          <span>
            <Badge className="alloc-badge" color={getColor(ratio)}>
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
        key={uuid()}
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
    values: object.isRequired
  }).isRequired
};
