import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTable } from 'react-table';
import 'react-table-6/react-table.css';
import { LoadingSpinner } from '_common';
import './Jobs.scss';
import * as ROUTES from '../../constants/routes';
import { jobsList } from './JobsFixture';

function JobsView() {
  const dispatch = useDispatch();
  const spinnerState = useSelector(state => state.spinner);
  //const jobs = useSelector(state => state.jobs.list);
  const jobs = jobsList;

  useEffect(() => {
    dispatch({ type: 'GET_JOBS', params: { limit: 100 } });
  }, [dispatch]);

  const columns = React.useMemo(
    () => [
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
    ],
    []
  )

  const data = React.useMemo(
    () => jobs,
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data })


  if (spinnerState) {
    return <LoadingSpinner />;
  }

  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                {...column.getHeaderProps()}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} className="jobs-table-body">
        {rows.map(row => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <td
                    {...cell.getCellProps()}
                  >
                    {cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
  
}

export default JobsView;
