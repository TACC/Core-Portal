import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useTable, useBlockLayout } from 'react-table';
import { FixedSizeList, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { LoadingSpinner, Message } from '_common';
import './DataFilesTable.scss';

// What to render if there are no files to display
const DataFilesTablePlaceholder = ({ section, data }) => {
  const dispatch = useDispatch();
  const system = useSelector(state => state.pushKeys.target);
  const loading = useSelector(state => state.files.loading[section]);
  const err = useSelector(state => state.files.error[section]);
  const filesLength = data.length;

  const pushKeys = e => {
    e.preventDefault();
    dispatch({
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: {
        operation: 'pushKeys',
        props: {
          onSuccess: {},
          system
        }
      }
    });
  };
  if (loading) {
    return (
      <div className="h-100 listing-placeholder">
        <LoadingSpinner />
      </div>
    );
  }
  if (err) {
    if (err === '502') {
      const link = strings => (
        <a
          className="data-files-nav-link"
          type="button"
          href="#"
          onClick={pushKeys}
        >
          {strings[0]}
        </a>
      );

      return (
        <div className="h-100 listing-placeholder">
          <Message type="warn">
            There was a problem accessing this file system. If this is your
            first time logging in, you may need to {link`push your keys`}.
          </Message>
        </div>
      );
    }
    if (err === '404') {
      return (
        <div className="h-100 listing-placeholder">
          <Message type="warn">
            The file or folder that you are attempting to access does not exist.
          </Message>
        </div>
      );
    }
    if (err === '403') {
      return (
        <div className="h-100 listing-placeholder">
          <Message type="warn">
            You are missing the required allocation for this system.
            Please submit a ticket for access.
          </Message>
        </div>
      )
    }
    return (
      <div className="h-100 listing-placeholder">
        <Message type="warn">
          There was a problem accessing this file system.
        </Message>
      </div>
    );
  }
  if (filesLength === 0) {
    return (
      <div className="h-100 listing-placeholder">
        <Message type="warn">No files or folders to show.</Message>
      </div>
    );
  }
  return <></>;
};
DataFilesTablePlaceholder.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  section: PropTypes.string.isRequired
};

const DataFilesTableRow = ({
  style,
  index,
  rowCount,
  row,
  section,
  rowSelectCallback,
  shadeEvenRows
}) => {
  const onClick = useCallback(() => rowSelectCallback(index), [index]);
  const onKeyDown = useCallback(
    e => e.key === 'Enter' && rowSelectCallback(index),
    [index]
  );
  const loadingScroll = useSelector(
    state => state.files.loadingScroll[section]
  );

  const selected = useSelector(state =>
    state.files.selected[section]
      ? state.files.selected[section].includes(index)
      : false
  );
  const isShaded = shadeEvenRows ? index % 2 === 0 : index % 2 === 1;
  if (index < rowCount) {
    return (
      <div
        style={style}
        className={`tr ${isShaded && 'tr-background-shading'} ${selected &&
          'tr-selected'}`}
        role="row"
        tabIndex={-1}
        index={row.index}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {row.cells.map(cell => {
          return (
            <div className="td" {...cell.getCellProps()}>
              {cell.render('Cell')}
            </div>
          );
        })}
      </div>
    );
  }
  if (loadingScroll) {
    return (
      <div style={style} className="tr scroll">
        <LoadingSpinner placement="inline" />
      </div>
    );
  }
  return <div style={style} />;
};
DataFilesTableRow.propTypes = {
  style: PropTypes.shape({}).isRequired,
  index: PropTypes.number.isRequired,
  rowCount: PropTypes.number.isRequired,
  row: PropTypes.shape({
    index: PropTypes.number,
    cells: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  section: PropTypes.string.isRequired,
  rowSelectCallback: PropTypes.func.isRequired,
  shadeEvenRows: PropTypes.bool.isRequired
};
DataFilesTableRow.defaultProps = { row: {} };

const DataFilesTable = ({
  data,
  columns,
  rowSelectCallback,
  scrollBottomCallback,
  section,
  hideHeader,
  shadeEvenRows
}) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const tableHeader = useRef({ clientHeight: 0 });
  useEffect(() => {
    if (tableHeader.current) {
      setHeaderHeight(tableHeader.current.clientHeight);
    } else {
      setHeaderHeight(30);
    }
  });

  // get height of table header to prevent overflow
  const [tableWidth, setTableWidth] = useState(500);
  const [tableHeight, setTableHeight] = useState(500);
  const resizeCallback = ({ width, height }) => {
    setTableWidth(width);
    setTableHeight(height);
  };

  const reachedEnd = useSelector(state => state.files.reachedEnd[section]);

  const sizedColumns = useMemo(
    () => columns.map(col => ({ ...col, width: col.width * tableWidth })),
    [columns, tableWidth]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns: sizedColumns,
      data
    },
    useBlockLayout
  );

  // handle scroll to bottom
  const rowHeight = 45;
  const itemCount = rows.length ? rows.length + 1 : 0;
  const onScroll = useCallback(
    ({ scrollOffset }) => {
      const diff =
        scrollOffset - itemCount * rowHeight + (tableHeight - headerHeight);
      if (diff === 0 && !reachedEnd) {
        scrollBottomCallback();
      }
    },
    [rowHeight, itemCount, tableHeight, headerHeight, reachedEnd]
  );

  // only bind render function when table data changes
  const RenderRow = useCallback(
    ({ style, index }) => {
      const row = rows[index];
      row && prepareRow(row);
      return (
        <DataFilesTableRow
          style={style}
          index={index}
          rowCount={rows.length}
          row={row}
          section={section}
          rowSelectCallback={rowSelectCallback}
          shadeEvenRows={shadeEvenRows}
        />
      );
    },
    [rows, shadeEvenRows]
  );

  return (
    <AutoSizer
      onResize={resizeCallback}
      disableHeight={process.env.NODE_ENV === 'test'}
      disableWidth={process.env.NODE_ENV === 'test'}
    >
      {({ width, height }) => (
        <div {...getTableProps()}>
          <div ref={tableHeader}>
            {headerGroups.map(headerGroup => {
              return hideHeader ? null : (
                <div
                  {...headerGroup.getHeaderGroupProps()}
                  className="tr tr-header"
                  style={{ width }}
                >
                  {headerGroup.headers.map(column => (
                    <div {...column.getHeaderProps()} className="td">
                      {column.render('Header')}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {/* table body */}
          <div
            style={{
              width,
              height: itemCount === 0 ? (height || 500) - headerHeight : 0
            }}
          >
            <DataFilesTablePlaceholder section={section} data={data} />
          </div>
          <div {...getTableBodyProps()}>
            {/* fallback if there are no rows */}
            <FixedSizeList
              className="data-files-table-body"
              height={itemCount > 0 ? (height || 500) - headerHeight : 0}
              itemCount={itemCount}
              itemSize={rowHeight}
              width={width || 500}
              overscanCount={0}
              onScroll={onScroll}
            >
              {React.memo(RenderRow, areEqual)}
            </FixedSizeList>
          </div>
        </div>
      )}
    </AutoSizer>
  );
};

DataFilesTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  rowSelectCallback: PropTypes.func.isRequired,
  scrollBottomCallback: PropTypes.func.isRequired,
  section: PropTypes.string.isRequired,
  hideHeader: PropTypes.bool,
  shadeEvenRows: PropTypes.bool
};

DataFilesTable.defaultProps = {
  hideHeader: false,
  shadeEvenRows: false
};

export default DataFilesTable;
