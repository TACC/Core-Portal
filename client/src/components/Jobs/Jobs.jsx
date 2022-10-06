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

function JobsView({ showDetails, showFancyStatus, rowProps }) {
  const dispatch = useDispatch();
  // const isLoading = useSelector((state) => state.jobs.loading);
  const isLoading = false;
  // const jobs = useSelector((state) => state.jobs.list);

  const { list: jobs } = {
    error: null,
    list: [
      {
        appId: 'hello-world',
        appVersion: '0.0.1',
        archiveSystemId: 'cloud.corral.community',
        created: '2022-10-03T22:21:58.219Z',
        ended: '2022-10-03T22:22:09.255Z',
        execSystemId: 'frontera',
        lastUpdated: '2022-10-03T22:22:09.255Z',
        name: 'hello - world - test',
        owner: 'ipark',
        remoteStarted: null,
        status: 'FAILED',
        tenant: 'a2cps',
        uuid: '793e9e90-53c3-4168-a26b-17230e2e4156-007',
      },
    ],
    loading: false,
    reachedEnd: false,
    submit: { submitting: false },
  };
  const error = useSelector((state) => state.jobs.error);
  // const hideDataFiles = useSelector(
  //   (state) => state.workbench.config.hideDataFiles
  // );

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
      params: { offset: jobs.length },
    });
  }, [jobs]);

  const jobDetailLink = useCallback(
    ({
      row: {
        original: { uuid, name },
      },
    }) => (
      <Link
        to={{
          pathname: `${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs/${uuid}`,
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
          jobId={el.row.original.uuid}
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
      accessor: '_links.archiveData.href',
      Cell: (el) => {
        console.log(el);
        const outputPath = '//data/awesome';
        // el.row.original.outputLocation || getOutputPathFromHref(el.value);
        return outputPath && false ? (
          <Link
            to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${outputPath}`}
            className="wb-link job__path"
          >
            {outputPath}
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
};
JobsView.defaultProps = {
  showDetails: false,
  showFancyStatus: false,
  rowProps: (row) => {},
};

export default JobsView;
