import React, { useMemo } from 'react';
import { useTable } from 'react-table';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { shape, array, string } from 'prop-types';
import { Link } from 'react-router-dom';

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
  const {
    data: { demographics },
    errors
  } = useSelector(state => state.profile);
  const columns = useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: ({ firstName, lastName }) =>
          `${firstName || ''} ${lastName || ''}`
      },
      { Header: 'Phone No.', accessor: 'phone' },
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
  const openModal = () =>
    dispatch({ type: 'OPEN_PROFILE_MODAL', payload: { required: true } });
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <strong>Required Information</strong>
        <Button
          color="link"
          onClick={openModal}
          className="form-button"
          disabled={errors.fields !== undefined}
        >
          Edit Required Information
        </Button>
      </div>
      <TableTemplate attributes={{ columns, data }} />
    </div>
  );
};
/* eslint-disable react/no-danger */
const LicenseCell = ({ cell: { value } }) => {
  const [modal, setModal] = React.useState(false);
  const toggle = () => setModal(!modal);
  const { license_type: type, template_html: __html } = value;
  return (
    <>
      <Button
        color="link"
        size="sm"
        onClick={toggle}
        className="license-button"
      >
        {value.current_user_license ? 'View Details' : 'Request Activation'}
      </Button>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader>{type}</ModalHeader>
        <ModalBody>
          <div dangerouslySetInnerHTML={{ __html }} />
          Click{' '}
          <Link
            to={`/workbench/dashboard/tickets/create?subject=${type}+Activation`}
          >
            here
          </Link>{' '}
          to open a ticket.
        </ModalBody>
      </Modal>
    </>
  );
};
LicenseCell.propTypes = {
  cell: shape({
    value: shape({
      license_type: string.isRequired,
      template_html: string.isRequired
    })
  }).isRequired
};
/* eslint-enable react/no-danger */
export const Licenses = () => {
  const { licenses } = useSelector(state => state.profile.data);
  const columns = useMemo(
    () =>
      licenses.map(license => {
        return {
          Header: license.license_type,
          accessor: () => license,
          Cell: LicenseCell
        };
      }),
    []
  );
  const data = useMemo(() => licenses, [licenses]);
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <strong>Licenses</strong>
      </div>
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
  const data = useMemo(() => integrations, [integrations]);
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <strong>3rd Party Apps</strong>
      </div>
      <div className="profile-component-body">
        <TableTemplate attributes={{ columns, data }} />
      </div>
    </div>
  );
};
export const ChangePassword = () => {
  const dispatch = useDispatch();
  const openModal = () =>
    dispatch({ type: 'OPEN_PROFILE_MODAL', payload: { password: true } });
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <strong>Change Password</strong>
      </div>
      <div className="profile-component-body">
        <Button onClick={openModal} className="manage-account-submit-button">
          Change Password
        </Button>
      </div>
    </div>
  );
};
export const OptionalInformation = () => {
  const {
    data: { demographics },
    errors
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const columns = useMemo(
    () => [
      { Header: 'My Website', accessor: 'website' },
      { Header: 'Orcid ID', accessor: 'orcid_id' },
      { Header: 'Professional Level', accessor: 'professional_level' },
      { Header: 'Research Bio', accessor: 'bio' }
    ],
    []
  );
  const data = useMemo(() => [demographics], []);
  const openModal = () =>
    dispatch({ type: 'OPEN_PROFILE_MODAL', payload: { optional: true } });
  return (
    <div className="profile-component-wrapper">
      <div className="profile-component-header">
        <strong>Optional Information</strong>
        <Button
          color="link"
          className="form-button"
          onClick={openModal}
          disabled={errors.fields !== undefined}
        >
          Edit Optional Information
        </Button>
      </div>
      <TableTemplate attributes={{ columns, data }} />
    </div>
  );
};
