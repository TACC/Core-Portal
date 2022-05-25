import React, { useState } from 'react';
import { shape, arrayOf, number, string } from 'prop-types';
import { Button, Badge } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AllocationsTeamViewModal } from './AllocationsModals';

const CELL_PROPTYPES = {
  cell: shape({
    value: arrayOf(shape({})).isRequired,
  }).isRequired,
};

export const Team = ({ cell: { value } }) => {
  const dispatch = useDispatch();
  const [teamModal, setTeamModal] = useState(false);
  const { projectId, name } = value;
  return (
    <>
      <Button
        className="btn btn-sm"
        color="secondary"
        onClick={() => {
          dispatch({
            type: 'GET_TEAMS',
            payload: { ...value },
          });
          setTeamModal(true);
        }}
        disabled={teamModal}
      >
        View Team
      </Button>
      <AllocationsTeamViewModal
        isOpen={teamModal}
        projectId={projectId}
        toggle={() => setTeamModal(!teamModal)}
        projectName={name}
      />
    </>
  );
};
Team.propTypes = {
  cell: shape({
    value: shape({
      projectId: number.isRequired,
      name: string.isRequired,
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
    values: shape({}).isRequired,
  }).isRequired,
};
