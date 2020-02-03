import React, { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTable } from 'react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { string } from 'prop-types';
import { Display, Operational } from './SystemMonitorCells';
import './SystemMonitor.scss';

const SystemsList = ({ id }) => {
  const systems = useSelector(state => state.systemMonitor.list);
  const data = useMemo(() => systems, []);
  const columns = useMemo(
    () => [
      {
        accessor: 'display_name',
        Cell: Display
      },
      {
        accessor: 'is_operational',
        Cell: Operational,
        className: 'operational-cell'
      }
    ],
    []
  );
  const { getTableProps, getTableBodyProps, rows, prepareRow } = useTable({
    columns,
    data
  });
  return (
    <table
      id={id}
      {...getTableProps({
        className: 'multi-system'
      })}
    >
      <tbody {...getTableBodyProps()}>
        {rows.length ? (
          rows.map((row, idx) => {
            prepareRow(row);
            const className = idx % 2 === 0 ? 'odd-row' : null;
            return (
              <tr
                {...row.getRowProps({
                  className
                })}
              >
                {row.cells.map(cell => (
                  <td
                    {...cell.getCellProps({
                      className: cell.column.className,
                      test: cell.column.testProp
                    })}
                  >
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })
        ) : (
          <tr>
            <td>No rows found</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
SystemsList.propTypes = {
  id: string.isRequired
};

const SystemMonitorView = () => {
  const { loading } = useSelector(state => state.systemMonitor);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);
  if (loading) {
    return (
      <div id="spin-sun">
        <FontAwesomeIcon icon={faSun} size="8x" spin />
      </div>
    );
  }
  return <SystemsList id="systems" />;
};

export default SystemMonitorView;
