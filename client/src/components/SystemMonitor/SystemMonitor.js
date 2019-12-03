import React from 'react';
import { Badge } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import useFetch from '../../utils/useFetch';
import './SystemMonitor.scss';

function SystemsList() {
  const res = useFetch(`/api/system-monitor/`, {});

  if (!res.response) {
    return (
      <div id="spin-sun">
        <FontAwesomeIcon icon={faSun} size="8x" spin />
      </div>
    );
  }

  const columns = [
    {
      accessor: 'display_name',
      Cell: el => (
        <span className="wb-text-primary wb-bold" id={`sysmonID${el.index}`}>
          {el.value}
        </span>
      )
    },
    {
      accessor: 'is_operational',
      Cell: el => (
        <>
          {el.value ? (
            <Badge color="success" className="label-system-status">
              Operational
            </Badge>
          ) : (
            <Badge color="warning" className="label-system-status">
              Maintenance
            </Badge>
          )}
        </>
      ),
      width: 115
    }
  ];

  return (
    <ReactTable
      keyField="id"
      data={res.response}
      columns={columns}
      resolveData={data => data.map(row => row)}
      pageSize={res.response.length}
      className="multi-system -striped -highlight"
    />
  );
}

function SystemMonitorView() {
  return <SystemsList id="systems" />;
}

export default SystemMonitorView;
