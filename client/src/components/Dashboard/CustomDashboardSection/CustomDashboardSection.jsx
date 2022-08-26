import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { SectionTableWrapper, SectionHeader } from '_common';
import { PropTypes, shape, string, arrayOf } from 'prop-types';
import { useTable } from 'react-table';
import { Table } from 'reactstrap';
import styles from './CustomDashboardSection.module.scss';

function CustomDashboardSection({ className }) {
  const { header, links } = useSelector(
    (state) => state.workbench.config.customDashboardSection
  );
  const columns = useMemo(
    () => [
      {
        id: 'text',
        Cell: ({ row: { original: link } }) => (
          <a
            className="wb-link"
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            {link.text}
          </a>
        ),
      },
    ],
    []
  );
  const data = useMemo(() => links, [links]);
  return (
    <SectionTableWrapper
      manualHeader={<SectionHeader isForList>{header}</SectionHeader>}
      className={`${styles['root']} ${className}`}
      manualContent
    >
      <TableTemplate attributes={{ columns, data }} />
    </SectionTableWrapper>
  );
}
CustomDashboardSection.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
};

const TableTemplate = ({ attributes }) => {
  const { getTableProps, getTableBodyProps, rows, prepareRow } =
    useTable(attributes);
  return (
    <Table {...getTableProps({ className: 'manage-account-table' })} borderless>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
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

export default CustomDashboardSection;
