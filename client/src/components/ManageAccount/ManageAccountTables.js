import React, { useMemo } from 'react';
import { useTable } from 'react-table';
import { Button, Modal, ModalHeader, ModalBody, Table } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { shape, string, arrayOf, bool } from 'prop-types';
import { SectionHeader, SectionTableWrapper } from '_common';
import { GoogleDriveModal } from './ManageAccountModals';
import './ManageAccount.scss';

export const TableTemplate = ({ attributes }) => {
  const { getTableProps, rows, prepareRow } = useTable(attributes);
  return (
    <Table
      {...getTableProps({ className: 'manage-account-table' })}
      responsive
      striped
    >
      <tbody>
        {rows.map(row => {
          prepareRow(row);
          return row.cells.map(cell => {
            const className =
              cell.column.Header === 'Research Bio' ? 'research-bio' : null;
            return (
              <tr {...row.getRowProps()} key={cell.getCellProps().key}>
                <th className={className}>
                  <span>{cell.column.render('Header')}</span>
                </th>
                <td {...cell.getCellProps({ className })} key={null}>
                  {cell.render('Cell')}
                </td>
              </tr>
            );
          });
        })}
      </tbody>
    </Table>
  );
};
TableTemplate.propTypes = {
  attributes: shape({
    columns: arrayOf(shape({})).isRequired,
    data: arrayOf(shape({})).isRequired,
    initialState: shape({
      hiddenColumns: arrayOf(string)
    })
  }).isRequired
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
  const hiddenColumns = Object.keys(demographics).filter(
    key => !demographics[key]
  );
  return (
    <SectionTableWrapper
      manualHeader={
        <SectionHeader
          actions={
            <Button
              color="link"
              onClick={openModal}
              className="form-button"
              disabled={errors.fields !== undefined}
            >
              Edit Required Information
            </Button>
          }
          isForList
        >
          Required Information
        </SectionHeader>
      }
      manualContent
    >
      <TableTemplate
        attributes={{
          columns,
          data,
          initialState: {
            hiddenColumns
          }
        }}
      />
    </SectionTableWrapper>
  );
};
/* eslint-disable react/no-danger */
const LicenseCell = ({ cell: { value } }) => {
  const dispatch = useDispatch();
  const [modal, setModal] = React.useState(false);
  const toggle = () => setModal(!modal);
  const { license_type: type, template_html: __html } = value;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <Button
        color="link"
        size="sm"
        onClick={toggle}
        className="license-button"
      >
        {value.current_user_license ? 'View Details' : 'Request Activation'}
      </Button>
      <Modal isOpen={modal} toggle={toggle} className="manage-account-modal">
        <ModalHeader
          className="manage-account-modal-header"
          toggle={toggle}
          charCode="X"
        >
          {type}
        </ModalHeader>
        <ModalBody>
          <div dangerouslySetInnerHTML={{ __html }} />
          Click{' '}
          <Button
            onClick={() =>
              dispatch({
                type: 'TICKET_CREATE_OPEN_MODAL',
                payload: {
                  subject: `${type} Activation`
                }
              })
            }
            color="link"
          >
            here
          </Button>{' '}
          to open a ticket.
        </ModalBody>
      </Modal>
    </div>
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
    <SectionTableWrapper
      manualHeader={<SectionHeader isForList>Licenses</SectionHeader>}
      manualContent
    >
      <TableTemplate attributes={{ columns, data }} />
    </SectionTableWrapper>
  );
};

export const IntegrationCell = ({ cell: { value } }) => {
  const { activated, label } = value;
  switch (label) {
    case 'Google Drive':
      return <GoogleDriveIntegrationCell activated={activated} />;
    default:
      return <></>;
  }
};
IntegrationCell.propTypes = {
  cell: shape({
    value: shape({
      activated: bool.isRequired,
      label: string.isRequired
    })
  }).isRequired
};

export const GoogleDriveIntegrationCell = ({ activated }) => {
  const [modal, setModal] = React.useState(false);
  const toggle = () => setModal(!modal);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {activated ? (
        <div>
          <a href="/accounts/applications/googledrive/disconnect/">
            Disconnect
          </a>
        </div>
      ) : (
        <div>
          <Button
            color="link"
            size="sm"
            onClick={toggle}
            className="license-button"
          >
            Setup Google Drive
          </Button>
        </div>
      )}
      <GoogleDriveModal active={modal} toggle={toggle} />
    </div>
  );
};
GoogleDriveIntegrationCell.propTypes = {
  activated: bool.isRequired
};

export const Integrations = () => {
  const { integrations } = useSelector(state => state.profile.data);
  const columns = useMemo(
    () =>
      integrations.map(app => ({
        Header: app.label,
        accessor: () => app,
        Cell: IntegrationCell
      })),
    []
  );
  const data = useMemo(() => integrations, [integrations]);
  return (
    <SectionTableWrapper
      manualHeader={<SectionHeader isForList>3rd Party Apps</SectionHeader>}
      manualContent
    >
      <TableTemplate attributes={{ columns, data }} />
    </SectionTableWrapper>
  );
};
export const ChangePassword = () => {
  const lastChanged = useSelector(state => {
    const { data } = state.profile;
    return data.passwordLastChanged;
  });
  const dispatch = useDispatch();
  const openModal = () =>
    dispatch({ type: 'OPEN_PROFILE_MODAL', payload: { password: true } });
  return (
    <article>
      <SectionHeader isForList>Change Password</SectionHeader>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1rem'
        }}
      >
        <Button onClick={openModal} className="manage-account-submit-button">
          Change Password
        </Button>
        {lastChanged && (
          <span
            style={{
              /* TODO: Move this to a stylehseet */
              /* FAQ: `14px` is part of normalization of "table" font sizes */
              fontSize: '0.875rem' /* 14px (assumed deviation from design) */,
              marginLeft: '1rem',
              color: '#707070'
            }}
          >
            Last Changed {lastChanged}
          </span>
        )}
      </div>
    </article>
    /* eslint-enable prettier/prettier */
  );
};
const WebsiteCell = ({ cell: { value } }) => {
  const website = value ? value.trim() : '';
  if (website) {
    const url = !/^(?:f|ht)tps?:\/\//.test(website)
      ? `https://${website}`
      : website;
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    );
  }
  return null;
};
WebsiteCell.propTypes = {
  cell: shape({ value: string })
};
WebsiteCell.defaultProps = { cell: { value: '' } };
const OrcidCell = ({ cell: { value } }) => (
  <a href={`https://orchid.org/${value}`} target="_blank" rel="noreferrer">
    {value}
  </a>
);
OrcidCell.propTypes = WebsiteCell.propTypes;
OrcidCell.defaultProps = WebsiteCell.defaultProps;
export const OptionalInformation = () => {
  const {
    data: { demographics },
    errors
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const columns = useMemo(
    () => [
      {
        Header: 'My Website',
        accessor: 'website',
        Cell: WebsiteCell
      },
      {
        Header: 'Orcid ID',
        accessor: 'orcid_id',
        Cell: OrcidCell
      },
      { Header: 'Professional Level', accessor: 'professional_level' },
      {
        Header: 'Research Bio',
        accessor: 'bio'
      }
    ],
    []
  );
  const data = useMemo(() => [demographics], []);
  const openModal = () =>
    dispatch({ type: 'OPEN_PROFILE_MODAL', payload: { optional: true } });
  return (
    <SectionTableWrapper
      manualHeader={
        <SectionHeader
          actions={
            <Button
              color="link"
              className="form-button"
              onClick={openModal}
              disabled={errors.fields !== undefined}
            >
              Edit Optional Information
            </Button>
          }
          isForList
        >
          Optional Information
        </SectionHeader>
      }
      manualContent
    >
      <TableTemplate attributes={{ columns, data }} />
    </SectionTableWrapper>
  );
};
