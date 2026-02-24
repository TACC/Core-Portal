import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useTable, useBlockLayout } from 'react-table';
import { FixedSizeList, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Link, useLocation } from 'react-router-dom';
import { useFileListing, useSystems } from 'hooks/datafiles';
import { LoadingSpinner, SectionMessage } from '_common';
import './DataFilesTable.scss';
import styles from './DataFilesTable.module.scss';
import * as ROUTES from '../../../constants/routes';
// What to render if there are no files to display
const DataFilesTablePlaceholder = ({ section, data }) => {
  const { params, error: err, loading } = useFileListing(section);

  const isPublicSystem = params?.scheme === 'public';

  const { api: currentListing, scheme } = params ?? {};

  const dispatch = useDispatch();
  const system = useSelector((state) => state.pushKeys.target);
  const currentUser = useSelector(
    (state) => state.authenticatedUser.user?.username
  );
  const currSystem = useSelector((state) =>
    state.systems.definitions.list.find(
      (sysDef) => sysDef.id === state.files.params.FilesListing.system
    )
  );
  const currSystemHost = currSystem ? currSystem.host : '';

  const modalRefs = useSelector((state) => state.files.refs);
  const systemDefErr = useSelector((state) => state.systems.definitions.error);

  const filesLength = data.length;
  const isGDrive = currentListing === 'googledrive';

  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);
  const downSystems = useSelector((state) =>
    state.systemMonitor
      ? state.systemMonitor.list
          .filter((currSystem) => !currSystem.is_operational)
          .map((downSys) => downSys.hostname)
      : []
  );
  const pushKeys = (e) => {
    e.preventDefault();
    const props = {
      onSuccess: {},
      system,
    };
    if (modalRefs.FileSelector) {
      props.callback = () => {
        modalRefs.FileSelector.props.toggle();
        dispatch({ type: 'CLEAR_REFS' });
      };
      modalRefs.FileSelector.props.toggle();
    }
    dispatch({
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: {
        operation: 'pushKeys',
        props,
      },
    });
  };
  if (loading) {
    return (
      <div className="h-100 listing-placeholder">
        <LoadingSpinner />
      </div>
    );
  }
  if (systemDefErr.status === 403) {
    return (
      <div className="h-100 listing-placeholder">
        <SectionMessage type="warning">
          Permission denied. You do not have permission to view this system.
        </SectionMessage>
      </div>
    );
  }
  if (err) {
    const GenericMessage = () => (
      <>
        An error occurred loading this directory. For help, please submit
        a&nbsp;
        <Link to="/workbench/dashboard/tickets/create" className="wb-link">
          ticket
        </Link>
        .
      </>
    );
    if (err === '500' || err === '401') {
      if (downSystems.includes(currSystemHost)) {
        return (
          <div className="h-100 listing-placeholder">
            <SectionMessage type="warning">
              System down for maintenance. Check System Status in the&nbsp;
              <Link to="/workbench/dashboard" className="wb-link">
                Dashboard
              </Link>
              &nbsp;for updates.
            </SectionMessage>
          </div>
        );
      }
      if (
        ['private', 'projects'].includes(scheme) &&
        currSystem?.effectiveUserId === currentUser
      ) {
        const sectionMessage =
          currSystem?.defaultAuthnMethod === 'TMS_KEYS' ? (
            <span>
              For help, please{' '}
              <Link
                className="wb-link"
                to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
              >
                submit a ticket.
              </Link>
            </span>
          ) : (
            <span>
              If this is your first time accessing this system, you may need to{' '}
              <a
                className="data-files-nav-link"
                type="button"
                href="#"
                onClick={pushKeys}
              >
                push your keys
              </a>
            </span>
          );

        return (
          <div className="h-100 listing-placeholder">
            <SectionMessage type="warning">
              There was a problem accessing this file system. {sectionMessage}
            </SectionMessage>
          </div>
        );
      }
      return (
        <div className="h-100 listing-placeholder">
          <SectionMessage type="warning">
            <GenericMessage />
          </SectionMessage>
        </div>
      );
    }
    if (err === '404') {
      return (
        <div className="h-100 listing-placeholder">
          <SectionMessage type="warning">
            The file or folder that you are attempting to access does not exist.
          </SectionMessage>
        </div>
      );
    }
    if (err === '403') {
      if (isPublicSystem)
        return (
          <div className="h-100 listing-placeholder">
            <SectionMessage type="warning">
              You must be logged in to view this data.
            </SectionMessage>
          </div>
        );
      return (
        <div className="h-100 listing-placeholder">
          <SectionMessage type="warning">
            You are missing the required allocation for this system. Please
            click&nbsp;
            <Link to="/workbench/allocations/manage" className="wb-link">
              here
            </Link>
            &nbsp;to request access.
          </SectionMessage>
        </div>
      );
    }
    if (err === '400') {
      const GDriveMessage = () => (
        <>
          Connect your Google Drive account under the &quot;3rd Party Apps&quot;
          section in the&nbsp;
          <Link to="/workbench/account/" className="wb-link">
            Manage Account page
          </Link>
          .
        </>
      );
      return (
        <div className="h-100 listing-placeholder">
          <SectionMessage type="warning">
            {isGDrive ? <GDriveMessage /> : <GenericMessage />}
          </SectionMessage>
        </div>
      );
    }
    return (
      <div className="h-100 listing-placeholder">
        <SectionMessage type="warning">
          There was a problem accessing this file system.
        </SectionMessage>
      </div>
    );
  }
  if (filesLength === 0) {
    return (
      <div className="h-100 listing-placeholder">
        <SectionMessage type="warning">
          No files or folders to show.
        </SectionMessage>
      </div>
    );
  }
  return <></>;
};
DataFilesTablePlaceholder.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  section: PropTypes.string.isRequired,
};

const DataFilesTableRow = ({
  style,
  index,
  rowCount,
  row,
  section,
  rowSelectCallback,
  shadeEvenRows,
}) => {
  const onClick = useCallback(() => rowSelectCallback(index), [index]);
  const onKeyDown = useCallback((e) => {
    if (e.key === ' ') {
      rowSelectCallback(index);
      e.preventDefault();
    }
  });
  const loadingScroll = useSelector(
    (state) => state.files.loadingScroll[section]
  );

  const selected = useSelector((state) =>
    state.files.selected[section]
      ? state.files.selected[section].includes(index)
      : false
  );
  const isShaded = shadeEvenRows ? index % 2 === 0 : index % 2 === 1;
  if (index < rowCount) {
    return (
      <div
        style={style}
        className={`tr ${isShaded && 'tr-background-shading'} ${
          selected && 'tr-selected'
        } ${row.original.disabled && 'tr-disabled'}`}
        role="row"
        tabIndex={-1}
        onClick={onClick}
        onKeyDown={onKeyDown}
        data-testid="file-listing-item"
      >
        {row.cells.map((cell) => {
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
    cells: PropTypes.arrayOf(PropTypes.shape({})),
    original: PropTypes.shape({
      disabled: PropTypes.bool,
    }),
  }),
  section: PropTypes.string.isRequired,
  rowSelectCallback: PropTypes.func.isRequired,
  shadeEvenRows: PropTypes.bool.isRequired,
};
DataFilesTableRow.defaultProps = { row: {} };

const DataFilesTable = ({
  data,
  columns,
  rowSelectCallback,
  scrollBottomCallback,
  section,
  hideHeader,
  shadeEvenRows,
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

  const { reachedEnd, loadingScroll } = useFileListing(section);

  const sizedColumns = useMemo(
    () => columns.map((col) => ({ ...col, width: col.width * tableWidth })),
    [columns, tableWidth]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns: sizedColumns,
        data,
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
      const threshold = rowHeight * 10;

      if (diff >= -threshold && !reachedEnd && !loadingScroll) {
        scrollBottomCallback();
      }
    },
    [rowHeight, itemCount, tableHeight, headerHeight, reachedEnd, loadingScroll]
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
      className={styles.root}
    >
      {({ width, height }) => (
        <div {...getTableProps()}>
          <div ref={tableHeader}>
            {headerGroups.map((headerGroup) => {
              return hideHeader ? null : (
                <div
                  {...headerGroup.getHeaderGroupProps()}
                  className="tr tr-header"
                  style={{ width }}
                >
                  {headerGroup.headers.map((column) => (
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
              height: itemCount === 0 ? (height || 500) - headerHeight : 0,
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
  shadeEvenRows: PropTypes.bool,
};

DataFilesTable.defaultProps = {
  hideHeader: false,
  shadeEvenRows: false,
};

export default DataFilesTable;
