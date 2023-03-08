import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, shallowEqual, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  AppIcon,
  InfiniteScrollTable,
  Message,
  SectionMessage,
  Section,
} from '_common';
import { formatDateTime } from 'utils/timeFormat';
// TODOv3: dropV2Jobs
import { getOutputPath, getOutputPathFromHref } from 'utils/jobsUtil';
import JobsStatus from './JobsStatus';
import './Jobs.scss';
import * as ROUTES from '../../constants/routes';
import Searchbar from '_common/Searchbar';
import queryStringParser from 'query-string';

function JobsView({
  showDetails,
  showFancyStatus,
  rowProps,
  includeSearchbar,
}) {
  const location = useLocation();
  // TODOv3: dropV2Jobs
  const version = location.pathname.includes('jobsv2') ? 'v2' : 'v3';
  const dispatch = useDispatch();
  const { isLoading, error, jobs } = useSelector((state) => {
    return version === 'v3'
      ? { ...state.jobs, jobs: state.jobs.list }
      : // TODOv3: dropV2Jobs
        { ...state.jobsv2, jobs: state.jobsv2.list };
  });

  const hideDataFiles = useSelector(
    (state) => state.workbench.config.hideDataFiles
  );

  const { isJobLoading, isNotificationLoading } = useSelector(
    (state) => ({
      isJobLoading: state.jobs.loading,
      isNotificationLoading: state.notifications.loading,
    }),
    shallowEqual
  );

  const query = queryStringParser.parse(useLocation().search);

  const noDataText = query.query_string ? (
    <Section className={'no-results-message'}>
      <SectionMessage type="warning">No results found</SectionMessage>
    </Section>
  ) : (
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

  useEffect(() => {
    dispatch({
      type: 'GET_JOBS',
      params: { offset: 0, queryString: query.query_string || '' },
    });
  }, [dispatch, query.query_string]);

  const infiniteScrollCallback = useCallback(() => {
    if (version === 'v3') {
      dispatch(
        {
          type: 'GET_JOBS',
          params: {
            offset: jobs.length,
            queryString: query.query_string || '',
          },
        },
        [dispatch, jobs, query.query_string]
      );
    } else {
      // TODOv3: dropV2Jobs
      dispatch(
        {
          type: 'GET_V2_JOBS',
          params: {
            offset: jobs.length,
            queryString: query.query_string || '',
          },
        },
        [dispatch, jobs, query.query_string]
      );
    }
  }, [jobs]);

  const jobDetailLink = useCallback(
    ({
      row: {
        original: { id, uuid, name },
      },
    }) => {
      const query = queryStringParser.parse(useLocation().search);

      // TODOv3: dropV2Jobs
      return uuid ? (
        <Link
          to={{
            pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs/${uuid}`,
            state: { jobName: name },
            search: query.query_string
              ? `?query_string=${query.query_string}`
              : '',
          }}
          className="wb-link"
        >
          View Details
        </Link>
      ) : (
        <Link
          to={{
            pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobsv2/${id}`,
            search: query.query_string
              ? `?query_string=${query.query_string}`
              : '',
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
        // TODOv3: dropV2Jobs
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
      // TODOv3: dropV2Jobs
      accessor: version === 'v3' ? 'outputLocation' : '_links.archiveData.href',
      Cell: (el) => {
        // TODOv3: dropV2Jobs
        if (version === 'v3') {
          console.log(el.row.original);
          const outputLocation = el.row.original.outputLocation;
          // const outputLocation = getOutputPath(el.row.original);
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
    <>
      {includeSearchbar && (
        <Searchbar
          api="tapis"
          resultCount={jobs.length}
          dataType="Jobs"
          infiniteScroll
          disabled={isJobLoading || isNotificationLoading}
        />
      )}
      <div className={includeSearchbar ? 'o-flex-item-table-wrap' : ''}>
        <InfiniteScrollTable
          tableColumns={filterColumns}
          tableData={jobs}
          onInfiniteScroll={infiniteScrollCallback}
          isLoading={isJobLoading || isNotificationLoading}
          className={showDetails ? 'jobs-detailed-view' : 'jobs-view'}
          noDataText={noDataText}
          getRowProps={rowProps}
        />
      </div>
    </>
  );
}

JobsView.propTypes = {
  showDetails: PropTypes.bool,
  showFancyStatus: PropTypes.bool,
  rowProps: PropTypes.func,
  includeSearchbar: PropTypes.bool,
};
JobsView.defaultProps = {
  showDetails: false,
  showFancyStatus: false,
  rowProps: (row) => {},
  includeSearchbar: true,
};

export default JobsView;
