import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import 'react-table-6/react-table.css';
import { AppIcon, InfiniteScrollTable, Message } from '_common';
import { getOutputPathFromHref } from 'utils/jobsUtil';
import { formatDateTime } from 'utils/timeFormat';
import JobsStatus from './JobsStatus';
import './Jobs.scss';
import * as ROUTES from '../../constants/routes';

function JobsView({ showDetails, showFancyStatus, rowProps }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(state => state.jobs.loading);
  const jobs = useSelector(state => state.jobs.list);
  const error = useSelector(state => state.jobs.error);
  const hideDataFiles = useSelector(
    state => state.workbench.config.hideDataFiles
  );

  const noDataText = (
    <>
      No recent jobs. You can submit jobs from the{' '}
      <Link
        to={`${ROUTES.WORKBENCH}${ROUTES.APPLICATIONS}`}
        className="wb-link"
      >
        Applications Page
      </Link>
      .
    </>
  );

  const infiniteScrollCallback = useCallback(() => {
    dispatch({
      type: 'GET_JOBS',
      params: { offset: jobs.length }
    });
  }, [jobs]);

  const jobDetailLink = useCallback(
    ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link
        to={{
          pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs/${id}`,
          state: { jobName: name }
        }}
        className="wb-link"
      >
        View Details
      </Link>
    ),
    []
  );

  if (error) {
    return (
      <Message type="warn" className="appDetail-error">
        We were unable to retrieve your jobs.
      </Message>
    );
  }

  const columns = [
    {
      Header: '',
      accessor: 'appId',
      Cell: el => (
        <span>
          <AppIcon appId={el.value} />
        </span>
      )
    },
    {
      Header: 'Job Name',
      accessor: 'name',
      Cell: el => (
        <span
          title={el.value}
          id={`jobID${el.row.index}`}
          className="job__name"
        >
          {el.value}
        </span>
      )
    },
    {
      Header: 'Job Status',
      headerStyle: { textAlign: 'left' },
      accessor: 'status',
      Cell: el => (
        <JobsStatus
          status={el.value}
          fancy={showFancyStatus}
          jobId={el.row.original.id}
        />
      ),
      id: 'jobStatusCol'
    },
    {
      Header: 'Job Details',
      accessor: 'id',
      show: showDetails,
      Cell: jobDetailLink
    },
    {
      Header: 'Output Location',
      headerStyle: { textAlign: 'left' },
      accessor: '_links.archiveData.href',
      Cell: el => {
        const outputPath =
          el.row.original.outputLocation || getOutputPathFromHref(el.value);
        return outputPath && !hideDataFiles ? (
          <Link
            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputPath}`}
            className="wb-link job__path"
          >
            {outputPath}
          </Link>
        ) : null;
      }
    },
    {
      Header: 'Date Submitted',
      headerStyle: { textAlign: 'left' },
      accessor: d => new Date(d.created),
      Cell: el => (
        <span id={`jobDate${el.index}`}>{`${formatDateTime(el.value)}`}</span>
      ),
      id: 'jobDateCol'
    }
  ];

  const filterColumns = columns.filter(f => f.show !== false);

  return (
    <InfiniteScrollTable
      tableColumns={filterColumns}
      tableData={jobs}
      onInfiniteScroll={infiniteScrollCallback}
      isLoading={isLoading}
      className={showDetails ? 'jobs-detailed-view' : 'jobs-view'}
      noDataText={noDataText}
      getRowProps={rowProps}
    />
  );
}

JobsView.propTypes = {
  showDetails: PropTypes.bool,
  showFancyStatus: PropTypes.bool,
  rowProps: PropTypes.func
};
JobsView.defaultProps = {
  showDetails: false,
  showFancyStatus: false,
  rowProps: row => {}
};

export default JobsView;
