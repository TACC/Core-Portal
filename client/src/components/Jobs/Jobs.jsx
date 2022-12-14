import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppIcon, InfiniteScrollTable, Message } from '_common';
import { getOutputPathFromHref } from 'utils/jobsUtil';
import { formatDateTime } from 'utils/timeFormat';
import JobsStatus from './JobsStatus';
import './Jobs.scss';
import * as ROUTES from '../../constants/routes';

function JobsView({ showDetails, showFancyStatus, rowProps, version }) {
  const dispatch = useDispatch();
  const { isLoading, error, jobs } = useSelector((state) => {
    return version === 'v3'
      ? { ...state.jobs, jobs: state.jobs.list }
      : { ...state.jobsv2, jobs: state.jobsv2.list };
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
    }) =>
      version === 'v3' ? (
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
      Cell: (el) => (
        <JobsStatus
          status={el.value}
          fancy={showFancyStatus}
          jobUuid={version === 'v3' ? el.row.original.uuid : el.row.original.id}
        />
      ),
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
      accessor: version === 'v3' ? 'outputLocation' : '_links.archiveData.href',
      Cell: (el) => {
        const outputLocation =
          version === 'v3'
            ? el.row.original.outputLocation
            : el.row.original.outputLocation || getOutputPathFromHref(el.value);
        return outputLocation && !hideDataFiles ? (
          <Link
            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputLocation}`}
            className="wb-link job__path"
          >
            {outputLocation}
          </Link>
        ) : null;
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
  version: PropTypes.string,
};
JobsView.defaultProps = {
  showDetails: false,
  showFancyStatus: false,
  rowProps: (row) => {},
};

export default JobsView;
