import React from 'react';
import { Table, Button, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import useFetch from '../../utils/useFetch';
import './Allocations.scss';


function Allocations() {
  const res = useFetch(`/api/users/allocations/`, {});

  if (!res.response) {
    return (
      <div id='spin-sun'>
        <FontAwesomeIcon icon={faSun} size="8x" spin />
      </div>
    );
  }

  return (
    <Table id="allocations">
      <thead>
        <tr>
          <th>Title</th>
          <th>Principal Investigator</th>
          <th>Team</th>
          <th>Expires</th>
          <th>Systems</th>
          <th>Awarded</th>
          <th>Remaining</th>
        </tr>
      </thead>
      <tbody>
        {res && res.response.allocs.map((el) => (
          <tr key={el.projectId}>
            <th scope="row" id={el.projectId}>{el.projectId}</th>
            <UncontrolledTooltip placement="top-start" target={el.projectId}>
              {el.title}
            </UncontrolledTooltip >
            <td>{el.pi}</td>
            <td>
              <Button color="link">View Team</Button>
            </td>
            <td colSpan={4}>
              {el.systems.map((sys) => (
                <div key={sys.name + el.projectId} className='container'>
                  <div className="row">
                    <div className="col-md">
                      {new Date(sys.allocation.end).toDateString()}
                    </div>
                    <div className="col-md">
                      {sys.name}
                    </div>
                    <div className="col-md">
                      {Math.round(sys.allocation.computeAllocated)} {sys.type === 'HPC' ? 'SU' : 'GB'}
                    </div>
                    <div className="col-md">
                      {Math.round(sys.allocation.computeAllocated - sys.allocation.computeUsed)} {sys.type === 'HPC' ? 'SU' : 'GB'}
                    </div>
                  </div>
                </div>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default Allocations;
