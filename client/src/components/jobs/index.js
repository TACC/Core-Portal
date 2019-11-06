import React from 'react';
import { Button, UncontrolledTooltip } from 'reactstrap';
import queryString from 'query-string'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import useFetch from '../../utils/useFetch';
import './jobs.css';

function Jobs() {
  const params = { limit: 100 };

  const res = useFetch(`/api/workspace/jobs/?${queryString.stringify(params)}`, {});

  if (!res.response) {
    return (
      <div id='spin-sun'>
        <FontAwesomeIcon icon={faSatellite} size="8x" spin />
      </div>
    )
  }

  const columns = [
    {
      Header: 'Job ID',
      accessor: 'name',
      Cell: el =>
      <>
        <span id={`jobID${el.index}`}>{el.value}</span>
        <UncontrolledTooltip placement="top-start" target={`jobID${el.index}`}>
          {el.value}
        </UncontrolledTooltip >
      </>
    },
    {
      Header: 'Output Location',
      headerStyle: { textAlign: 'left' },
      accessor: '_links.archiveData.href',
      Cell: el =>
      <>
        <Button color='link' className='jobsList' id={`jobLocation${el.index}`}>{el.value.split('/').slice(7).filter(Boolean).join('/')}</Button>
        <UncontrolledTooltip placement="top-start" target={`jobLocation${el.index}`}>
          {el.value.split('/').slice(7).filter(Boolean).join('/')}
        </UncontrolledTooltip >
      </>
    },
    {
      Header: 'Date Submitted',
      headerStyle: { textAlign: 'left' },
      accessor: d => new Date(d.created).toString(),
      id: 'jobDateCol'
    },
    {
      Header: 'Job Status',
      headerStyle: { textAlign: 'left' },
      accessor: d => d.status.substr(0, 1).toUpperCase() + d.status.substr(1).toLowerCase(),
      id: 'jobStatusCol'
    }
  ]

  return (
    <ReactTable
      keyField='id'
      data={res.response.response}
      columns={columns}
      resolveData={data => data.map(row => row)}
      style={{
        height: '400px' // Force size of table
      }}
      pageSize={res.response.response.length}
      className='jobsList -striped -highlight'
    />
  );
}

export default Jobs;
