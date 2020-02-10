import React from 'react';
import { useTable } from 'react-table';
import { useSelector } from 'react-redux';

export const RequiredInformation = () => {
  const profile = useSelector(state => state.profile);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: ({ firstName, lastName }) => `${firstName} ${lastName}`
      },
      {
        Header: 'Email',
        accessor: 'email'
      },
      {
        Header: 'Institution',
        accessor: 'institution'
      },
      { Header: 'Title', accessor: 'title' },
      { Header: 'Country of Residence', accessor: 'country' },
      { Header: 'Country of Citizenship', accessor: 'citizenship' },
      { Header: 'Ethnicity', accessor: 'ethnicity' },
      { Header: 'Gender', accessor: 'gender' }
    ],
    []
  );
  const data = React.useMemo(() => [profile.data], []);
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
      <tbody>
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
      </tbody>
    </table>
  );
};

// TODO: Make these tables
export const OptionalInformation = () => <div>Optional Information</div>;
export const Licenses = () => <div>Licenses</div>;
export const ThirdPartyApps = () => <div>3rd Party Apps</div>;
export const ChangePassword = () => <div>Change Password</div>;
