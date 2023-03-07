import React from 'react';
import {
  useHistory,
  useLocation,
  NavLink as RRNavLink,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, NavLink } from 'reactstrap';
import {
  Button,
  DescriptionList,
  LoadingSpinner,
  Expand,
  Message,
} from '_common';
import queryStringParser from 'query-string';
import PropTypes from 'prop-types';
import { formatDateTime } from 'utils/timeFormat';
import {
  isOutputState,
  getOutputPath,
  isTerminalState,
  getExecutionPath,
} from 'utils/jobsUtil';
import { getStatusText } from '../../Jobs/JobsStatus';
import * as ROUTES from '../../../constants/routes';
import styles from './JobHistoryModal.module.scss';
import './JobHistoryModal.css';

const placeHolder = '...';

function DataFilesLink({ path, children, disabled }) {
  const text = children || path;
  return (
    <NavLink
      tag={RRNavLink}
      to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${path}`}
      className={styles.link}
      disabled={disabled}
    >
      {text}
    </NavLink>
  );
}

DataFilesLink.propTypes = {
  path: PropTypes.string.isRequired,
  children: PropTypes.string,
  disabled: PropTypes.bool,
};

DataFilesLink.defaultProps = {
  children: null,
  disabled: false,
};

const reduceInputParameters = (data) =>
  data.reduce((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});

function JobHistoryContent({
  jobDetails,
  jobDisplay,
  jobName,
  toggle,
  // TODOdropV2Jobs
  version,
}) {
  const dispatch = useDispatch();
  // TODOdropV2Jobs
  const outputLocation =
    version === 'v3'
      ? getOutputPath(jobDetails)
      : `${jobDetails.archiveSystem}/${jobDetails.archivePath}`;
  const created = formatDateTime(new Date(jobDetails.created));
  const hideDataFiles = useSelector(
    (state) => state.workbench.config.hideDataFiles
  );

  const hasOutput = isOutputState(jobDetails.status);
  const lastUpdated = formatDateTime(new Date(jobDetails.lastUpdated));
  const hasFailedStatus = jobDetails.status === 'FAILED';
  const hasEnded = isTerminalState(jobDetails.status);

  const appDataObj = {
    'App ID': jobDetails.appId,
    'App Version': jobDetails.appVersion,
  };
  const statusDataObj = {
    Submitted: created,
    [`${getStatusText(jobDetails.status)}`]: lastUpdated,
    [hasFailedStatus ? 'Failure Report' : 'Last Status Message']: (
      <Expand
        detail={hasFailedStatus ? 'Last Status Message' : 'System Output'}
        message={
          <pre>
            $
            {version === 'v3'
              ? jobDetails.lastMessage
              : // TODOdropV2Jobs
                jobDetails.lastStatusMessage}
          </pre>
        }
      />
    ),
  };

  if (jobDetails.remoteOutcome) {
    statusDataObj['Remote Outcome'] = jobDetails.remoteOutcome;
  }

  const inputAndParamsDataObj = {
    ...reduceInputParameters(jobDisplay.inputs),
    ...reduceInputParameters(jobDisplay.parameters),
  };
  const configDataObj = {
    'Execution System': jobDetails.execSystemId,
  };
  const outputDataObj = {
    'Job Name': jobName,
    'Output Location': outputLocation,
  };

  const resubmitJob = () => {
    dispatch({
      type: 'SUBMIT_JOB',
      payload: {
        job_uuid: jobDetails.uuid,
        action: 'resubmit',
        onSuccess: {
          type: 'GET_JOBS',
          params: {
            offset: 0,
          },
        },
      },
    });
    toggle();
  };

  if ('queue' in jobDisplay) {
    configDataObj.Queue = jobDisplay.queue;
  }

  // TODOdropV2Jobs
  if (version === 'v3') {
    configDataObj['Max Minutes'] = jobDetails.maxMinutes;
  } else {
    configDataObj['Max Hours'] = jobDetails.maxHours;
  }

  if ('coresPerNode' in jobDisplay) {
    configDataObj['Cores On Each Node'] = jobDisplay.coresPerNode;
  }

  // TODOdropV2Jobs
  if ('processorsPerNode' in jobDisplay && version === 'v2') {
    configDataObj['Processors On Each Node'] = jobDisplay.processorsPerNode;
  }

  if ('nodeCount' in jobDisplay) {
    configDataObj['Node Count'] = jobDisplay.nodeCount;
  }
  if ('allocation' in jobDisplay) {
    configDataObj.Allocation = jobDisplay.allocation;
  }

  // TODOdropV2Jobs
  if (jobDetails.status !== 'FINISHED') {
    if (version === 'v3') {
      configDataObj['Execution Directory'] = jobDetails.execSystemExecDir;
      configDataObj['Input Directory'] = jobDetails.execSystemInputDir;
      configDataObj['Output Directory'] = jobDetails.execSystemOutputDir;
    } else {
      configDataObj['Temporary Working Directory'] = jobDetails.workPath;
    }
  }

  const data = {
    Application: <DescriptionList data={appDataObj} />,
    Status: <DescriptionList data={statusDataObj} />,
    Inputs: <DescriptionList data={inputAndParamsDataObj} />,
    Configuration: <DescriptionList data={configDataObj} />,
    Output: <DescriptionList data={outputDataObj} />,
  };

  return (
    <>
      <div className={`${styles['left-panel']} ${styles['panel-content']}`}>
        <DescriptionList
          density="compact"
          data={
            !hideDataFiles && version === 'v3' && {
              Execution: (
                <DataFilesLink
                  path={getExecutionPath(jobDetails)}
                  disabled={hasOutput}
                >
                  View in Data Files
                </DataFilesLink>
              ),
              Output: version == 'v3' && (
                <DataFilesLink path={outputLocation} disabled={!hasOutput}>
                  View in Data Files
                </DataFilesLink>
              ),
            }
          }
        />
        {hasEnded && version === 'v3' && (
          // TODOdropV2Jobs
          <Button
            type="primary"
            attr="submit"
            className={styles['submit-button']}
            onClick={resubmitJob}
          >
            Resubmit Job
          </Button>
        )}
      </div>
      <DescriptionList
        className={`${styles['right-panel']} ${styles['panel-content']}`}
        data={data}
      />
    </>
  );
}

JobHistoryContent.propTypes = {
  jobName: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  jobDetails: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  jobDisplay: PropTypes.object.isRequired,
  toggle: PropTypes.func.isRequired,
  // TODOdropV2Jobs
  version: PropTypes.string.isRequired,
};
JobHistoryContent.defaultProps = {
  jobName: '',
  jobDisplay: {},
};

function JobHistoryModal({ uuid, version }) {
  const { loading, loadingError, job, display } = useSelector((state) => {
    if (version === 'v3') {
      const job = state.jobDetail;
      return {
        loading: job.loading,
        loadingError: job.loadingError,
        job: job.job,
        display: job.display,
      };
    } else {
      // TODOdropV2Jobs
      const jobv2 = state.jobsv2.list.find((job) => job.id === uuid);
      return {
        loading: false,
        loadingError: null,
        job: jobv2,
        display: jobv2.display,
      };
    }
  });
  const { state } = useLocation();
  let jobName = job ? job.name : placeHolder;

  if (jobName === placeHolder) {
    if (state && state.jobName) {
      jobName = state.jobName;
    }
  }

  const query = queryStringParser.parse(useLocation().search);

  const history = useHistory();
  const close = () => {
    // TODOdropV2Jobs
    if (version === 'v3') {
      history.push(
        `${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}${
          query.query_string ? `?query_string=${query.query_string}` : ''
        }`,
        {
          fromJobHistoryModal: true,
        }
      );
    } else {
      history.push(
        `${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBSV2}${
          query.query_string ? `?query_string=${query.query_string}` : ''
        }`,
        {
          fromJobHistoryModal: true,
        }
      );
    }
  };

  const headerData = {
    // TODOdropV2Jobs
    ...(version === 'v3' ? { 'Job UUID': uuid } : { 'Job ID': uuid }),
    Application: display ? display.applicationName : placeHolder,
    System: display ? display.systemName : placeHolder,
  };

  return (
    <Modal
      isOpen
      className={`${styles.root} job-history-modal`}
      toggle={close}
      size="lg"
    >
      <ModalHeader className={styles.header} toggle={close} charCode="&#xe912;">
        <div className="d-inline-block text-truncate">{jobName}</div>
        <DescriptionList
          data={headerData}
          direction="horizontal"
          className={styles['header-details']}
        />
      </ModalHeader>

      <ModalBody>
        <div className={styles['modal-body-container']}>
          {loading && <LoadingSpinner />}
          {loadingError && (
            <Message type="warn" className={styles.error}>
              Unable to retrieve job information.
            </Message>
          )}
          {!loading && !loadingError && job && (
            <JobHistoryContent
              jobName={jobName}
              jobDetails={job}
              jobDisplay={display}
              toggle={close}
              version={version}
            />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

JobHistoryModal.propTypes = {
  uuid: PropTypes.string.isRequired,
  // TODOdropV2Jobs
  version: PropTypes.string.isRequired,
};

export default JobHistoryModal;
