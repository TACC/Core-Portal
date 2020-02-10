import React from 'react';
import { Link } from 'react-router-dom';
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
    <div className="required-information-wrapper">
      <div className="profile-component-header">
        <span>Required Information</span>
        <Link to="/accounts/profile">Edit Required Information</Link>
      </div>
      <table
        {...getTableProps({
          className: 'manage-account-table'
        })}
      >
        <tbody>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <td key={column.Header}>{column.render('Header')}</td>
              ))}
            </tr>
          ))}

          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <th {...cell.getCellProps()}>{cell.render('Cell')}</th>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// TODO: Make these tables
export const OptionalInformation = () => <div>Optional Information</div>;
export const Licenses = () => (
  <div className="profile-component-wrapper">
    <div className="profile-component-header">Licenses</div>
    <div className="profile-component-body">
      <b>License Table</b>
    </div>
  </div>
);
export const ThirdPartyApps = () => (
  <div className="profile-component-wrapper">
    <div className="profile-component-header">3rd Party Apps</div>
    <div className="profile-component-body">
      <b>3rd Party Apps Table</b>
    </div>
  </div>
);
export const ChangePassword = () => (
  <div className="profile-component-wrapper">
    <div className="profile-component-header">Change Password</div>
    <div className="profile-component-body">
      <b>Change Password Button and Last Changed Date</b>
    </div>
  </div>
);
