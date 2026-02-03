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
  // TODOv3: dropV2Jobs
  version,
}) {
  const dispatch = useDispatch();

  const hideDataFiles = useSelector(
    (state) => state.workbench.config.hideDataFiles
  );

  // TODOv3: dropV2Jobs
  const outputLocation =
    version === 'v3'
      ? getOutputPath(jobDetails)
      : `${jobDetails.archiveSystem}/${jobDetails.archivePath}`;
  const hasOutput = isOutputState(jobDetails.status);
  const created = formatDateTime(new Date(jobDetails.created));
  const lastUpdated = formatDateTime(new Date(jobDetails.lastUpdated));
  const hasFailedStatus = jobDetails.status === 'FAILED';
  const hasEnded = isTerminalState(jobDetails.status);

  const appDataObj = {
    'App ID': jobDetails.appId,
    'App Version': jobDetails.appVersion,
  };
  const lastMessageTitle = hasFailedStatus
    ? 'Failure Report'
    : 'Last Status Message';
  const statusDataObj = {
    Submitted: created,
    [`${getStatusText(jobDetails.status)}`]: lastUpdated,
    [lastMessageTitle]: (
      <Expand
        detail={hasFailedStatus ? 'Last Status Message' : 'System Output'}
        message={<pre>{jobDetails.lastMessage}</pre>}
      />
    ),
  };

  if (version === 'v2') {
    // TODOv3: dropV2Jobs
    delete statusDataObj[lastMessageTitle];
  }

  if (jobDetails.remoteOutcome) {
    statusDataObj['Remote Outcome'] = jobDetails.remoteOutcome;
  }

  const inputAndParamsDataObj = {
    ...reduceInputParameters(jobDisplay.inputs),
    ...reduceInputParameters(jobDisplay.parameters),
  };
  const configDataObj = {
    System: jobDisplay.systemName,
  };
  const outputDataObj = {
    'Job Name': jobName,
    'Output Location': outputLocation,
    'Archive System': jobDetails.archiveSystemId,
    'Archive Directory': jobDetails.archiveSystemDir,
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

  const cancelJob = () => {
    dispatch({
      type: 'SUBMIT_JOB',
      payload: {
        job_uuid: jobDetails.uuid,
        action: 'cancel',
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

  // TODOv3: dropV2Jobs
  if (version === 'v3') {
    configDataObj['Max Minutes'] = jobDetails.maxMinutes;
  } else {
    configDataObj['Max Hours'] = jobDetails.maxHours;
  }

  if ('coresPerNode' in jobDisplay) {
    configDataObj['Cores On Each Node'] = jobDisplay.coresPerNode;
  }

  // TODOv3: dropV2Jobs
  if ('processorsPerNode' in jobDisplay && version === 'v2') {
    configDataObj['Processors On Each Node'] = jobDisplay.processorsPerNode;
  }

  if ('nodeCount' in jobDisplay) {
    configDataObj['Node Count'] = jobDisplay.nodeCount;
  }
  if ('allocation' in jobDisplay) {
    configDataObj.Allocation = jobDisplay.allocation;
  }

  if ('notes' in jobDisplay) {
    configDataObj.notes = jobDisplay.notes;
  }

  if ('reservation' in jobDisplay) {
    configDataObj.Reservation = jobDisplay.reservation;
  }
  // TODOv3: dropV2Jobs
  if (version === 'v3') {
    configDataObj['Execution Directory'] = jobDetails.execSystemExecDir;
  } else {
    configDataObj['Execution Directory'] = jobDetails.workPath;
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
            !hideDataFiles &&
            version === 'v3' && {
              Execution: (
                <DataFilesLink
                  path={getExecutionPath(jobDetails)}
                  disabled={hasOutput}
                >
                  View in Data Files
                </DataFilesLink>
              ),
              Output: (
                <DataFilesLink path={outputLocation} disabled={!hasOutput}>
                  View in Data Files
                </DataFilesLink>
              ),
            }
          }
        />
        {!hasEnded && version === 'v3' && (
          // TODOv3: dropV2Jobs
          <Button
            type="primary"
            attr="submit"
            className={styles['submit-button']}
            onClick={cancelJob}
          >
            Cancel Job
          </Button>
        )}
        {hasEnded && version === 'v3' && (
          // TODOv3: dropV2Jobs
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
  // TODOv3: dropV2Jobs
  version: PropTypes.string.isRequired,
};
JobHistoryContent.defaultProps = {
  jobName: '',
  jobDisplay: {},
};

function JobHistoryModal({ uuid, version }) {
  const { loading, loadingError, job, display } = useSelector((state) => {
    if (version === 'v3') {
      return state.jobDetail;
    } else {
      // TODOv3: dropV2Jobs
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
    // TODOv3: dropV2Jobs
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
    // TODOv3: dropV2Jobs
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
        {jobName}
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
  // TODOv3: dropV2Jobs
  version: PropTypes.string.isRequired,
};
// TODOv3: dropV2Jobs
JobHistoryModal.defaultProps = {
  version: 'v3',
};

export default JobHistoryModal;
