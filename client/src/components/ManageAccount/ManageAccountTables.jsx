import React, { useMemo } from 'react';
import { useTable } from 'react-table';
import { Modal, ModalHeader, ModalBody, Table } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { shape, string, arrayOf, bool } from 'prop-types';
import { Button, SectionHeader, SectionTableWrapper } from '_common';
import { IntegrationModal } from './ManageAccountModals';
import './ManageAccount.scss';
import styles from './ManageAccountTables.module.css';

export const TableTemplate = ({ attributes }) => {
  const { getTableProps, rows, prepareRow } = useTable(attributes);
  return (
    <Table
      {...getTableProps({ className: 'manage-account-table' })}
      responsive
      striped
    >
      <tbody>
        {rows.map((row) => {
          prepareRow(row);
          return row.cells.map((cell) => {
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
      hiddenColumns: arrayOf(string),
    }),
  }).isRequired,
};

export const ProfileInformation = () => {
  const dispatch = useDispatch();
  const {
    data: { demographics },
    errors,
  } = useSelector((state) => state.profile);
  const columns = useMemo(
    () => [
      {
        Header: 'Full Name',
        accessor: ({ firstName, lastName }) =>
          `${firstName || ''} ${lastName || ''}`,
      },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Institution', accessor: 'institution' },
      { Header: 'Country of Citizenship', accessor: 'citizenship' },
    ],
    []
  );
  const data = useMemo(() => [demographics], []);
  const openModal = () =>
    dispatch({ type: 'OPEN_PROFILE_MODAL', payload: { required: true } });
  const hiddenColumns = Object.keys(demographics).filter(
    (key) => !demographics[key]
  );
  return (
    <SectionTableWrapper
      manualHeader={
        <SectionHeader
          actions={
            <a
              className={`wb-link ${styles['edit-profile-link']}`}
              href="https://accounts.tacc.utexas.edu/profile"
              target="_blank"
              rel="noreferrer"
            >
              Edit Profile Information
            </a>
          }
          isForList
        >
          Profile Information
        </SectionHeader>
      }
      manualContent
    >
      <TableTemplate
        attributes={{
          columns,
          data,
          initialState: {
            hiddenColumns,
          },
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
        justifyContent: 'flex-end',
      }}
    >
      <Button type="link" onClick={toggle}>
        {value.current_user_license ? 'View Details' : 'Request Activation'}
      </Button>
      <Modal isOpen={modal} toggle={toggle} className="manage-account-modal">
        <ModalHeader
          className="manage-account-modal-header"
          toggle={toggle}
          charCode="&#xe912;"
        >
          {type}
        </ModalHeader>
        <ModalBody>
          <div dangerouslySetInnerHTML={{ __html }} />
          <Button
            onClick={() =>
              dispatch({
                type: 'TICKET_CREATE_OPEN_MODAL',
                payload: {
                  subject: `${type} Activation`,
                },
              })
            }
            type="link"
          >
            New Ticket
          </Button>
        </ModalBody>
      </Modal>
    </div>
  );
};
LicenseCell.propTypes = {
  cell: shape({
    value: shape({
      license_type: string.isRequired,
      template_html: string.isRequired,
    }),
  }).isRequired,
};
/* eslint-enable react/no-danger */
export const Licenses = () => {
  const { licenses } = useSelector((state) => state.profile.data);

  const columns = useMemo(
    () =>
      licenses.map((license) => {
        return {
          Header: license.license_type,
          accessor: () => license,
          Cell: LicenseCell,
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
  const { activated, label, disconnect, connect } = value;
  const [modal, setModal] = React.useState(false);
  const toggle = () => setModal(!modal);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {activated ? (
        <div>
          <a className="wb-link" href={disconnect}>
            Disconnect
          </a>
        </div>
      ) : (
        <div>
          <Button type="link" onClick={toggle}>
            {'Setup ' + label}
          </Button>
        </div>
      )}
      <IntegrationModal
        active={modal}
        toggle={toggle}
        connect={connect}
        label={label}
      />
    </div>
  );
};
IntegrationCell.propTypes = {
  cell: shape({
    value: shape({
      activated: bool.isRequired,
      label: string.isRequired,
      disconnect: string.isRequired,
      connect: string.isRequired,
    }),
  }).isRequired,
};

export const Integrations = () => {
  const { integrations } = useSelector((state) => state.profile.data);
  const columns = useMemo(
    () =>
      integrations.map((app) => ({
        Header: app.label,
        accessor: () => app,
        Cell: IntegrationCell,
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
export const PasswordInformation = () => {
  const lastChanged = useSelector((state) => {
    const { data } = state.profile;
    return data.passwordLastChanged;
  });
  return (
    <article>
      <SectionHeader isForList>Password Information</SectionHeader>
      <div
        style={{
          paddingTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {lastChanged && (
          <span
            style={{
              /* TODO: Move this to a stylehseet */
              /* FAQ: `14px` is part of normalization of "table" font sizes */
              fontSize: '0.875rem' /* 14px (assumed deviation from design) */,
              marginLeft: '1rem',
              color: '#707070',
            }}
          >
            Last Changed {lastChanged}
          </span>
        )}
        <a
          className={`wb-link ${styles['change-password-link']}`}
          href="https://accounts.tacc.utexas.edu/change_password"
          target="_blank"
          rel="noreferrer"
        >
          Change Password
        </a>
      </div>
    </article>
  );
};
const WebsiteCell = ({ cell: { value } }) => {
  const website = value ? value.trim() : '';
  if (website) {
    const url = !/^(?:f|ht)tps?:\/\//.test(website)
      ? `https://${website}`
      : website;
    return (
      <a className="wb-link" href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    );
  }
  return null;
};
WebsiteCell.propTypes = {
  cell: shape({ value: string }),
};
WebsiteCell.defaultProps = { cell: { value: '' } };
const OrcidCell = ({ cell: { value } }) => (
  <a
    className="wb-link"
    href={`https://orcid.org/${value}`}
    target="_blank"
    rel="noreferrer"
  >
    {value}
  </a>
);
OrcidCell.propTypes = WebsiteCell.propTypes;
OrcidCell.defaultProps = WebsiteCell.defaultProps;
