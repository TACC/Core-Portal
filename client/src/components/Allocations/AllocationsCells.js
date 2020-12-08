import React, { useState } from 'react';
import { shape, arrayOf, number, string } from 'prop-types';
import { Button, Badge } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AllocationsTeamViewModal } from './AllocationsModals';

const CELL_PROPTYPES = {
  cell: shape({
    value: arrayOf(shape({})).isRequired
  }).isRequired
};

export const Team = ({ cell: { value } }) => {
  const dispatch = useDispatch();
  const isManager = useSelector(state => {
    const { firstName, lastName } = state.profile.data.demographics;
    const name = `${firstName} ${lastName}`;
    const allocations = state.allocations.active.concat(
      state.allocations.inactive
    );
    const current = allocations.find(el => el.projectId === value.projectId);
    console.log(allocations, name, current);
    if (current && current.pi === name) return true;
    return false;
  });
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <Button
        className="btn btn-sm"
        color="link"
        onClick={() => {
          dispatch({
            type: 'GET_TEAMS',
            payload: { ...value }
          });
          setOpenModal(true);
        }}
        disabled={openModal}
      >
        View Team
      </Button>
      {isManager && (
        <>
          <span>|</span>
          <Button className="btn btn-sm" color="link">
            Hello
          </Button>
        </>
      )}
      <AllocationsTeamViewModal
        isOpen={openModal}
        pid={value.projectId}
        toggle={() => setOpenModal(!openModal)}
      />
    </>
  );
};
Team.propTypes = {
  cell: shape({
    value: shape({
      projectId: number.isRequired,
      name: string.isRequired
    }).isRequired
  }).isRequired
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
        <div key={uuidv4()} className="sub-table-cell">
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
    values: shape({}).isRequired
  }).isRequired
};
