import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Table,
  Form,
  Button,
  Input
} from 'reactstrap';
import { capitalize, has } from 'lodash';
import { useSelector } from 'react-redux';
import { useTable } from 'react-table';
import { LoadingSpinner } from '_common';
import './AllocationsManageTeamModal.module.scss';

const AllocationsManageTeamTable = ({ rawData, pid }) => {
  const data = React.useMemo(() => rawData, [rawData]);
  console.log(rawData);
  // return <table />;
  const columns = React.useMemo(
    () => [
      {
        Header: 'Members',
        accessor: ({ firstName, lastName }) => `${firstName} ${lastName}`
      },
      {
        Header: 'Role',
        accessor: ({ role }) => {
          switch (role) {
            case 'PI':
              return 'Principal Investigator';
            case 'Delegate':
              return 'Allocation Manager';
            default:
              return 'Member';
          }
        }
      },
      {
        Header: 'Username',
        accessor: ({ username, role }) =>
          role === 'Standard' ? `${username} ${pid}` : ''
      }
    ],
    [rawData]
  );
  const {
    getTableProps,
    getTableBodyProps,
    rows,
    prepareRow,
    headerGroups
  } = useTable({
    columns,
    data
  });
  return (
    <Table hover responsive borderless size="sm" {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

const UserSearch = () => {
  const [term, setTerm] = useState(null);
  const [results, setResults] = useState([]);
  const handleSubmit = async event => {
    event.preventDefault();
    setTerm(event.target.user.value);
  };
  React.useEffect(() => {
    const fetchData = async () => {
      const root =
        'https://portal.tacc.utexas.edu/projects-and-allocations/-/pm/api/users?action=search&field=username&term=';
      const r = await fetch(`${root}${term}`);
      const json = await r.json();

      console.log(json);
      setResults(json);
    };
    fetchData();
  }, [term]);
  return (
    <>
      <Form onSubmit={handleSubmit} className="d-flex">
        <Input name="user" style={{ marginRight: '2px' }} />
        <Button type="submit">Search</Button>
      </Form>
      {results && <code>{JSON.stringify(results, null, 2)}</code>}
    </>
  );
};

const AllocationsManageTeamModal = ({ isOpen, toggle, pid, ...props }) => {
  const { teams, loadingUsernames, errors } = useSelector(
    state => state.allocations
  );
  const error = has(errors.teams, pid);
  const isLoading = loadingUsernames[pid] && loadingUsernames[pid].loading;
  console.log(teams);

  return (
    <Modal isOpen={isOpen} toggle={toggle} styleName="root">
      <ModalHeader>Hello World</ModalHeader>
      <ModalBody className="p-2">
        <UserSearch />
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div styleName="listing-wrapper">
            <AllocationsManageTeamTable rawData={teams[pid]} pid={pid} />
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default AllocationsManageTeamModal;
