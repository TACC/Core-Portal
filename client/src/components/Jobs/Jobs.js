import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import 'react-table-6/react-table.css';
import { PaginationTable } from '_common';
import './Jobs.scss';
import * as ROUTES from '../../constants/routes';

function JobsView() {
  const dispatch = useDispatch();
  const isLoading = useSelector(state => state.jobs.loading);
  const jobs = useSelector(state => state.jobs.list);

  useEffect(() => {
    dispatch({ type: 'GET_JOBS', params: { limit: 20 } });
  }, [dispatch]);

  const paginationCallback = useCallback(offset => {
    // The only way we have some semblance of 
    // knowing whether or not there are more jobs 
    // is if the number of jobs is not a multiple
    // of the pagination limit. 
    // i.e., you asked for 100 jobs but got 96.
    if (offset % 20 == 0) {
      dispatch({ type: 'GET_JOBS', params: { offset, limit: 20 } });
    }
  }, []);

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
      Cell: el => {
        const outputPath = el.value
          .split('/')
          .slice(7)
          .filter(Boolean)
          .join('/');
        return outputPath !== 'listings' ? (
          <Link
            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputPath}`}
            className="wb-link"
          >
            {outputPath}
          </Link>
        ) : null;
      }
    },
    {
      Header: 'Date Submitted',
      headerStyle: { textAlign: 'left' },
      accessor: d => new Date(d.created),
      Cell: el => (
        <span id={`jobDate${el.index}`}>
          {`${el.value.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            timeZone: 'America/Chicago'
          })}
          ${el.value.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Chicago'
          })}`}
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
    <PaginationTable
      tableColumns={columns}
      tableData={jobs}
      onPagination={paginationCallback}
      isLoading={isLoading}
    />
  );
}

export default JobsView;
