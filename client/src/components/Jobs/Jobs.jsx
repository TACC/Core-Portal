import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, shallowEqual, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  AppIcon,
  InfiniteScrollTable,
  HighlightSearchTerm,
  Message,
  SectionMessage,
  Section,
  Button,
} from '_common';
import { formatDateTime } from 'utils/timeFormat';
import { getOutputPath } from 'utils/jobsUtil';
import JobsStatus from './JobsStatus';
import './Jobs.scss';
import JobsSearchInfoModal from './JobsSearchInfoModal';
import * as ROUTES from '../../constants/routes';
import Searchbar from '_common/Searchbar';
import queryStringParser from 'query-string';

function JobsView({
  showDetails,
  showFancyStatus,
  rowProps,
  includeSearchbar,
}) {
  // TODOv3: dropV2Jobs
  const location = useLocation();
  const version = location.pathname.includes('jobsv2') ? 'v2' : 'v3';
  const dispatch = useDispatch();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { error, jobs } = useSelector((state) => {
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

  const noDataText =
    // TODOv3: dropV2Jobs
    version === 'v2' || query.query_string ? (
      'No results found.'
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
    // TODOv3: dropV2Jobs
    const dispatchType = version === 'v3' ? 'GET_JOBS' : 'GET_V2_JOBS';

    if (!isJobLoading) {
      dispatch({
        type: dispatchType,
        params: { offset: jobs.length, queryString: query.query_string || '' },
      });
    }
  }, [dispatch, jobs, query.query_string, isJobLoading]);

  const jobDetailLink = useCallback(
    ({
      row: {
        original: { id, uuid, name },
      },
    }) => {
      // TODOv3: dropV2Jobs
      const jobsPathname = uuid ? `/jobs/${uuid}` : `/jobsv2/${id}`;
      return (
        <Link
          to={{
            pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}${jobsPathname}`,
            state: { jobName: name },
            search: query.query_string
              ? `?query_string=${query.query_string}`
              : '',
          }}
          className="wb-link"
        >
          {query.query_string ? <b>View Details</b> : 'View Details'}
        </Link>
      );
    },
    [query]
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
      Cell: (el) => {
        return (
          <span
            title={el.value}
            id={`jobID${el.row.index}`}
            className="job__name"
          >
            {query.query_string ? (
              <HighlightSearchTerm
                searchTerm={query.query_string}
                content={el.value}
              />
            ) : (
              el.value
            )}
          </span>
        );
      },
    },
    {
      Header: 'Job Status',
      headerStyle: { textAlign: 'left' },
      accessor: 'status',
      Cell: (el) => {
        // TODOv3: dropV2Jobs
        if (el.row.original.uuid) {
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
              status="ARCHIVED"
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
      show: version === 'v3' /* TODOv3: dropV2Jobs. remove show here  */,
      headerStyle: { textAlign: 'left' },
      Cell: (el) => {
        // TODOv3: dropV2Jobs
        if (el.row.original.uuid) {
          const outputLocation = getOutputPath(el.row.original);

          return outputLocation && !hideDataFiles ? (
            <Link
              to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputLocation}`}
              className="wb-link job__path"
            >
              {query.query_string ? (
                <HighlightSearchTerm
                  searchTerm={query.query_string}
                  content={outputLocation}
                />
              ) : (
                outputLocation
              )}
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <Searchbar
            api="tapis"
            resultCount={jobs.length}
            dataType="Jobs"
            infiniteScroll
            disabled={isJobLoading || isNotificationLoading}
          />
          <Button
            attr="button"
            type="secondary"
            size="small"
            onClick={() => setIsInfoModalOpen(true)}
          >
            i
          </Button>
        </div>
      )}

      <JobsSearchInfoModal
        isOpen={isInfoModalOpen}
        toggle={() => setIsInfoModalOpen(!isInfoModalOpen)}
      />

      <InfiniteScrollTable
        tableColumns={filterColumns}
        tableData={jobs}
        onInfiniteScroll={infiniteScrollCallback}
        isLoading={isJobLoading || isNotificationLoading}
        className={showDetails ? 'jobs-detailed-view' : 'jobs-view'}
        noDataText={
          <Section className={'no-results-message'}>
            <SectionMessage type="info">{noDataText}</SectionMessage>
          </Section>
        }
        getRowProps={rowProps}
        columnMemoProps={[
          version,
          query,
        ]} /* TODOv3: dropV2Jobs. Refactor version prop. */
      />
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
