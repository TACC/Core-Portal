import React from 'react';
import { useTable } from 'react-table';

export const RequiredInformation = () => {
  const testUser = [
    {
      name: 'Owais',
      email: 'owais@mail.com',
      institution: 'University of Texas'
    }
  ];
  const columns = React.useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: 'name'
      },
      {
        Header: 'Email',
        accessor: 'email'
      },
      {
        Header: 'Institution',
        accessor: 'institution'
      }
    ],
    []
  );
  const data = React.useMemo(() => testUser, {});
  const { getTableProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data
  });
  return (
    <table
      {...getTableProps({
        className: 'manage-account-table'
      })}
    >
      {headerGroups.map(headerGroup => (
        <tr {...headerGroup.getHeaderGroupProps()}>
          {headerGroup.headers.map(column => (
            <th key={column.Header}>{column.render('Header')}</th>
          ))}
        </tr>
      ))}

      {rows.map(row => {
        prepareRow(row);
        return (
          <tr {...row.getRowProps()}>
            {row.cells.map(cell => (
              <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
            ))}
          </tr>
        );
      })}
    </table>
  );
};

// TODO: Make these tables
export const OptionalInformation = () => <div>Optional Information</div>;
export const Licenses = () => <div>Licenses</div>;
export const ThirdPartyApps = () => <div>3rd Party Apps</div>;
export const ChangePassword = () => <div>Change Password</div>;
