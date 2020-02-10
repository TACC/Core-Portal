import React, { useMemo } from 'react';
import { useTable } from 'react-table';
import { Button } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { shape, array } from 'prop-types';

export const TableTemplate = ({ attributes: { columns, data } }) => {
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
  );
};
TableTemplate.propTypes = {
  attributes: shape({ columns: array.isRequired, data: array.isRequired })
    .isRequired
};

export const RequiredInformation = () => {
  const dispatch = useDispatch();
  const { demographics } = useSelector(state => state.profile.data);
  const columns = useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: ({ firstName, lastName }) => `${firstName} ${lastName}`
      },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Institution', accessor: 'institution' },
      { Header: 'Title', accessor: 'title' },
      { Header: 'Country of Residence', accessor: 'country' },
      { Header: 'Country of Citizenship', accessor: 'citizenship' },
      { Header: 'Ethnicity', accessor: 'ethnicity' },
      { Header: 'Gender', accessor: 'gender' }
    ],
    []
  );
  const data = useMemo(() => [demographics], []);
  const openModal = () => dispatch({ type: 'OPEN_EDIT_REQUIRED' });
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <span>Required Information</span>
        <Button color="link" onClick={openModal}>
          Edit Required Information
        </Button>
      </div>
      <TableTemplate attributes={{ columns, data }} />
    </div>
  );
};

export const Licenses = () => {
  const { licenses } = useSelector(state => state.profile.data);
  const columns = useMemo(
    () => [{ Header: 'MATLAB' }, { Header: 'LS-DYNA' }],
    []
  );
  const data = useMemo(() => licenses, []);
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">Licenses</div>
      <div className="profile-component-body">
        <TableTemplate attributes={{ columns, data }} />
      </div>
    </div>
  );
};

export const ThirdPartyApps = () => {
  const { integrations } = useSelector(state => state.profile.data);
  const columns = useMemo(
    () => [
      { Header: 'Google Drive' },
      { Header: 'Box' },
      { Header: 'Dropbox' }
    ],
    []
  );
  const data = useMemo(() => integrations, []);
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">3rd Party Apps</div>
      <div className="profile-component-body">
        <TableTemplate attributes={{ columns, data }} />
      </div>
    </div>
  );
};
export const ChangePassword = () => {
  const dispatch = useDispatch();
  const openModal = () => dispatch({ type: 'OPEN_CHANGEPW' });
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">Change Password</div>
      <div className="profile-component-body">
        <Button onClick={openModal}>Change Password</Button>
      </div>
    </div>
  );
};
export const OptionalInformation = () => {
  const dispatch = useDispatch();
  const columns = useMemo(
    () => [
      { Header: 'My Website' },
      { Header: 'Orcid ID' },
      { Header: 'Professional Level' },
      { Header: 'Research Bio' }
    ],
    []
  );
  const data = [];
  const openModal = () => dispatch({ type: 'OPEN_EDIT_OPTIONAL' });
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <span>Optional Information</span>
        <Button color="link" onClick={openModal}>
          Edit Optional Information
        </Button>
      </div>
      <TableTemplate attributes={{ columns, data }} />
    </div>
  );
};
