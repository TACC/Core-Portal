import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useParams, useLocation } from 'react-router-dom'
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './Jobs.scss';

function JobsView() {
  // let { id } = useParams();
  // let location = useLocation();
  const dispatch = useDispatch();
  const spinnerState = useSelector(state => state.spinner);
  const jobs = useSelector(state => state.jobs);

  useEffect(() => {
    dispatch({ type: 'GET_JOBS', params: { limit: 100 } });
  }, [dispatch]);

  if (spinnerState) {
    return (
      <div id="spin-sun">
        <FontAwesomeIcon icon={faSatellite} size="8x" spin />
      </div>
    );
  }

  const columns = [
    {
      Header: 'Job ID',
      accessor: 'name',
      Cell: el => (
        <span title={el.value} id={`jobID${el.index}`}>
          {el.value}
        </span>
      )
    },
    {
      Header: 'Output Location',
      headerStyle: { textAlign: 'left' },
      accessor: '_links.archiveData.href',
      Cell: el => (
        <Button color="link" className="jobsList" id={`jobLocation${el.index}`}>
          <span title={el.value}>
            {el.value
              .split('/')
              .slice(7)
              .filter(Boolean)
              .join('/')}
          </span>
        </Button>
      )
    },
    {
      Header: 'Date Submitted',
      headerStyle: { textAlign: 'left' },
      accessor: d => new Date(d.created),
      Cell: el => (
        <span id={`jobDate${el.index}`}>
          {`${el.value.getMonth() +
            1}/${el.value.getDate()}/${el.value.getFullYear()}
          ${el.value.getHours()}:${el.value.getMinutes()}:${el.value.getSeconds()}`}
        </span>
      ),
      id: 'jobDateCol',
      width: 150
    },
    {
      Header: 'Job Status',
      headerStyle: { textAlign: 'left' },
      accessor: d =>
        d.status.substr(0, 1).toUpperCase() + d.status.substr(1).toLowerCase(),
      id: 'jobStatusCol',
      width: 100
    }
  ];

  return (
    <ReactTable
      keyField="id"
      data={jobs}
      columns={columns}
      resolveData={data => data.map(row => row)}
      pageSize={jobs.length}
      className="jobsList -striped -highlight"
      defaultSorted={[{ id: 'name' }]}
      noDataText={
        <>
          No recent jobs. You can submit jobs from the{' '}
          <a className="wb-link" href="/workbench/applications">
            Applications Page
          </a>
          .
        </>
      }
    />
  );
}

export default JobsView;
