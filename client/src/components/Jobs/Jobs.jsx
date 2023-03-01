import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { AppIcon, InfiniteScrollTable, Message } from '_common';
// TODOdropV2Jobs
import { getOutputPathFromHref } from 'utils/jobsUtil';
import { formatDateTime } from 'utils/timeFormat';
import JobsStatus from './JobsStatus';
import './Jobs.scss';
import * as ROUTES from '../../constants/routes';

function JobsView({ showDetails, showFancyStatus, rowProps }) {
  const location = useLocation();
  // TODOdropV2Jobs
  const version = location.pathname.includes('jobsv2') ? 'v2' : 'v3';
  const dispatch = useDispatch();
  const { isLoading, error, jobs } = useSelector((state) => {
    return version === 'v3'
      ? { ...state.jobs, jobs: state.jobs.list }
      : // TODOdropV2Jobs
      { ...state.jobsv2, jobs: state.jobsv2.list };
  });

  const hideDataFiles = useSelector(
    (state) => state.workbench.config.hideDataFiles
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
    if (version === 'v3') {
      dispatch({
        type: 'GET_JOBS',
        params: { offset: jobs.length },
      });
    } else {
      // TODOdropV2Jobs
      dispatch({
        type: 'GET_V2_JOBS',
        params: { offset: jobs.length },
      });
    }
  }, [jobs]);

  const jobDetailLink = useCallback(
    ({
      row: {
        original: { id, uuid, name },
      },
    }) => {
      // TODOdropV2Jobs
      return uuid ? (
        <Link
          to={{
            pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs/${uuid}`,
            state: { jobName: name },
          }}
          className="wb-link"
        >
          View Details
        </Link>
      ) : (
        <Link
          to={{
            pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobsv2/${id}`,
            state: { jobName: name },
          }}
          className="wb-link"
        >
          View Details
        </Link>
      );
    },
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
      Cell: (el) => (
        <span>
          <AppIcon appId={el.value} />
        </span>
      ),
    },
    {
      Header: 'Job Name',
      accessor: 'name',
      Cell: (el) => (
        <span
          title={el.value}
          id={`jobID${el.row.index}`}
          className="job__name"
        >
          {el.value}
        </span>
      ),
    },
    {
      Header: 'Job Status',
      headerStyle: { textAlign: 'left' },
      accessor: 'status',
      Cell: (el) => {
        // TODOdropV2Jobs
        if (version === 'v3') {
          return (
            <JobsStatus
              status={el.value}
              fancy={showFancyStatus}
              jobUuid={el.row.original.uuid}
            />
          );
        } else {
          return (
            <JobsStatus
              status={'Archived'}
              fancy={showFancyStatus}
              jobUuid={el.row.original.id}
            />
          );
        }
      },
      id: 'jobStatusCol',
    },
    {
      Header: 'Job Details',
      accessor: 'uuid',
      show: showDetails,
      Cell: jobDetailLink,
    },
    {
      Header: 'Output Location',
      headerStyle: { textAlign: 'left' },
      // TODOdropV2Jobs
      accessor: version === 'v3' ? 'outputLocation' : '_links.archiveData.href',
      Cell: (el) => {
        // TODOdropV2Jobs
        if (version === 'v3') {
          const outputLocation = el.row.original.outputLocation;
          return outputLocation && !hideDataFiles ? (
            <Link
              to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputLocation}`}
              className="wb-link job__path"
            >
              {outputLocation}
            </Link>
          ) : null;
        } else {
          return null;
        }
      },
    },
    {
      Header: 'Date Submitted',
      headerStyle: { textAlign: 'left' },
      accessor: (d) => new Date(d.created),
      Cell: (el) => (
        <span id={`jobDate${el.index}`}>{`${formatDateTime(el.value)}`}</span>
      ),
      id: 'jobDateCol',
    },
  ];

  const filterColumns = columns.filter((f) => f.show !== false);

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
  rowProps: PropTypes.func,
};
JobsView.defaultProps = {
  showDetails: false,
  showFancyStatus: false,
  rowProps: (row) => { },
};

export default JobsView;
